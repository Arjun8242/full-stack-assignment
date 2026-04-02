import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().trim().min(1).max(120).optional().allow(null).messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name cannot be empty',
    'string.max': 'Name must be between 1 and 120 characters'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});
