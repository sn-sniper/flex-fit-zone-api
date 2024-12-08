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

module.exports = { registerSchema, loginSchema };
