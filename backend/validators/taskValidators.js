import Joi from 'joi';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

export const taskIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid task id',
    'string.empty': 'Invalid task id',
    'any.required': 'Invalid task id'
  })
});

export const createTaskSchema = Joi.object({
  title: Joi.string().trim().max(200).required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required',
    'string.max': 'Title must be at most 200 characters'
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description must be at most 2000 characters'
  }),
  dueDate: Joi.date().iso().optional().allow(null).messages({
    'date.format': 'Due date must be a valid ISO 8601 date',
    'date.base': 'Due date must be a valid ISO 8601 date'
  }),
  status: Joi.string().valid('pending', 'completed').optional().messages({
    'any.only': 'Status must be pending or completed'
  })
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().max(200).messages({
    'string.empty': 'Title cannot be empty',
    'string.max': 'Title must be at most 200 characters'
  }),
  description: Joi.string().trim().max(2000).allow('', null).messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description must be at most 2000 characters'
  }),
  dueDate: Joi.date().iso().allow(null).messages({
    'date.format': 'Due date must be a valid ISO 8601 date',
    'date.base': 'Due date must be a valid ISO 8601 date'
  }),
  status: Joi.string().valid('pending', 'completed').messages({
    'any.only': 'Status must be pending or completed'
  })
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update'
  });
