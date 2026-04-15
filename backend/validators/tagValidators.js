import Joi from 'joi';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

export const tagIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid tag id',
    'string.empty': 'Invalid tag id',
    'any.required': 'Invalid tag id'
  })
});

export const createTagSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Tag name is required',
    'any.required': 'Tag name is required',
    'string.max': 'Tag name must be at most 100 characters'
  })
});

export const updateTagSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Tag name cannot be empty',
    'any.required': 'Tag name is required',
    'string.max': 'Tag name must be at most 100 characters'
  })
});
