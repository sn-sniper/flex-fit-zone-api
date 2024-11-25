require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors({
    origin: function(origin,callback){
        if(!origin) return callback(null, true);

        callback(null, true)
    },
    credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
