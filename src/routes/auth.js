const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const {Encryption} = require('../services/Encryption');
const { registerSchema, loginSchema ,workoutSchema, exerciseSchema } = require('../services/validators');
const router = express.Router();

const SECRETKEY = process.env.SECRETKEY || 'devil';

router.post('/register', async (req, res) => {
    const { username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv } = req.body;
    const EncData = Encryption(cardHolderName, cardNumber,cvv);
    const data = { username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv };
    const { error } = registerSchema.validate({ username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv });
    if (error) return res.status(400).json({ error: error.details[0].message, data : data});

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const stmt = db.prepare(`
            INSERT INTO users (username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(username , email , hashedPassword, planType, EncData.NewHolder,EncData.NewNumber, expiryDate,EncData.NewCvv);
        res.status(201).json({ message: 'User registered successfully', getData : username });
    } catch (err) {
        res.status(400).json({ error: err });
    }
});

router.get('/admin', async (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT id, username, email, planType, admin FROM users
        `);
        const users = stmt.all();

        res.status(200).json({ message: 'Users fetched successfully', users });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { error } = loginSchema.validate({ email, password });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = user.admin;
    const username = user.username;
    const plan = user.planType;
    const id = user.id;
    const token = jwt.sign({ id: user.id, username: user.username }, SECRETKEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, admin, username, plan, id});
});

router.post('/admin/register', async (req, res) => {
    const { username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv, admin } = req.body;

    const { error } = registerSchema.validate({ username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const stmt = db.prepare(`
            INSERT INTO users (username, email, password, planType, cardHolderName, cardNumber, expiryDate, cvv, admin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(username, email, hashedPassword, planType, cardHolderName, cardNumber, expiryDate, cvv, admin);
        res.status(201).json({ message: 'Admin user created successfully', username });
    } catch (err) {
        res.status(400).json({ error: err });
    }
});

router.post('/admin/addWorkout', async (req, res) => {
    const { workout_name, days_per_week, duration, level, exercises } = req.body;

    try {
        // Validate workout data
        const workoutValidation = workoutSchema.validate({ workout_name, days_per_week, duration, level });
        if (workoutValidation.error) {
            return res.status(400).json({ error: workoutValidation.error.details[0].message });
        }

        // Validate exercises data
        if (!Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({ error: "Exercises must be a non-empty array." });
        }
        for (const exercise of exercises) {
            const exerciseValidation = exerciseSchema.validate({ workout_id: 1, exercise_name: exercise }); // workout_id is a placeholder here
            if (exerciseValidation.error) {
                return res.status(400).json({ error: exerciseValidation.error.details[0].message });
            }
        }

        // Insert workout into the database
        const workoutStmt = db.prepare(`
            INSERT INTO workouts (workout_name, days_per_week, duration, level)
            VALUES (?, ?, ?, ?)
        `);
        const workoutResult = workoutStmt.run(workout_name, days_per_week, duration, level);

        const workoutId = workoutResult.lastInsertRowid;

        // Insert exercises into the database
        const exerciseStmt = db.prepare(`
            INSERT INTO exercises (workout_id, exercise_name)
            VALUES (?, ?)
        `);
        for (const exercise of exercises) {
            exerciseStmt.run(workoutId, exercise);
        }

        res.status(201).json({ message: "Workout and exercises added successfully!", workoutId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while adding the workout." });
    }
});

router.get('/getWorkouts', async (req, res) => {
    try {
        const workouts = db.prepare(`
            SELECT id, workout_name, days_per_week, duration, level
            FROM workouts
        `).all();

        const workoutData = workouts.map(workout => {
            const exercises = db.prepare(`
                SELECT exercise_name 
                FROM exercises 
                WHERE workout_id = ?
            `).all(workout.id);

            return {
                ...workout,
                exercises: exercises.map(exercise => exercise.exercise_name)
            };
        });

        res.status(200).json({message: "Workouts Fetched Successfully",workoutData});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while fetching workouts." });
    }
});// Add a workout for a user
router.post('/addUserWorkout', async (req, res) => {
    const { userId, workoutId } = req.body;

    if (!userId || !workoutId) {
        return res.status(400).json({ message: 'Invalid input. userId and workoutId are required.' });
    }

    try {
        // Ensure user exists
        const userExists = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure workout exists
        const workoutExists = db.prepare(`SELECT id FROM workouts WHERE id = ?`).get(workoutId);
        if (!workoutExists) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Insert the user workout relationship
        const insertStmt = db.prepare(`
            INSERT INTO user_workouts (user_id, workout_id)
            VALUES (?, ?)
        `);
        insertStmt.run(userId, workoutId);

        res.status(201).json({ message: 'Workout added for the user successfully' });
    } catch (error) {
        console.error('Error adding workout:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get workouts for a user
router.get('/getUserWorkouts/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const selectStmt = db.prepare(`
            SELECT w.id AS workout_id, w.workout_name, w.duration, w.days_per_week, e.exercise_name
            FROM user_workouts uw
            LEFT JOIN workouts w ON uw.workout_id = w.id
            LEFT JOIN exercises e ON w.id = e.workout_id
            WHERE uw.user_id = ?
        `);

        const userWorkouts = selectStmt.all(userId);

        const groupedWorkouts = userWorkouts.reduce((acc, curr) => {
            const { workout_id, workout_name, duration, days_per_week, exercise_name } = curr;
            if (!acc[workout_id]) {
                acc[workout_id] = {
                    workout_id,
                    workout_name,
                    duration,
                    daysPerWeek: days_per_week,
                    exercises: []
                };
            }
            if (exercise_name) {
                acc[workout_id].exercises.push(exercise_name);
            }
            return acc;
        }, {});

        res.status(200).json({ userWorkouts: Object.values(groupedWorkouts) });
    } catch (error) {
        console.error('Error fetching user workouts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;

