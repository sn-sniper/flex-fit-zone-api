const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    planType: Joi.string().required(),
    cardHolderName: Joi.string().allow(null, '').optional(),
    cardNumber: Joi.string().allow(null, '').optional(),
    expiryDate: Joi.string().allow(null, '').optional(),
    cvv: Joi.string().allow(null, '').optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const workoutSchema = Joi.object({
    workout_name: Joi.string().min(3).max(50).required(),
    days_per_week: Joi.number().integer().min(1).max(7).required(),
    duration: Joi.string().pattern(/^\d+\s(minutes|hours)$/).required(), // e.g., "30 minutes"
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').required()
});

const exerciseSchema = Joi.object({
    workout_id: Joi.number().integer().required(),
    exercise_name: Joi.string().min(2).max(50).required()
});


module.exports = { registerSchema, loginSchema, workoutSchema, exerciseSchema };
