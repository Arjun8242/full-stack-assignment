import { AppError } from '../utils/appError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((item) => ({
        message: item.message,
        path: item.path.join('.'),
        type: item.type
      }));

      return next(new AppError('Validation failed', 400, details));
    }

    req[source] = value;
    return next();
  };
};
