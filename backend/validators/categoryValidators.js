import Joi from 'joi';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

export const categoryIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid category id',
    'string.empty': 'Invalid category id',
    'any.required': 'Invalid category id'
  })
});

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required',
    'string.max': 'Category name must be at most 100 characters'
  })
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Category name cannot be empty',
    'any.required': 'Category name is required',
    'string.max': 'Category name must be at most 100 characters'
  })
});
