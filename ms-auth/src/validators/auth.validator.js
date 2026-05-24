const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'El formato del correo electrónico no es válido.',
      'any.required': 'El correo electrónico es obligatorio.',
      'string.empty': 'El correo electrónico no puede estar vacío.'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres.',
      'string.max': 'La contraseña no puede exceder 128 caracteres.',
      'any.required': 'La contraseña es obligatoria.',
      'string.empty': 'La contraseña no puede estar vacía.'
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'any.required': 'El nombre es obligatorio.',
      'string.empty': 'El nombre no puede estar vacío.',
      'string.max': 'El nombre no puede exceder 50 caracteres.'
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'any.required': 'El apellido es obligatorio.',
      'string.empty': 'El apellido no puede estar vacío.',
      'string.max': 'El apellido no puede exceder 50 caracteres.'
    }),
  role: Joi.string()
    .valid('student', 'teacher')
    .default('student')
    .messages({
      'any.only': 'El rol debe ser "student" o "teacher".'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'El formato del correo electrónico no es válido.',
      'any.required': 'El correo electrónico es obligatorio.',
      'string.empty': 'El correo electrónico no puede estar vacío.'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es obligatoria.',
      'string.empty': 'La contraseña no puede estar vacía.'
    })
});

/**
 * Express middleware factory for Joi validation.
 * @param {Joi.ObjectSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message);
    const err = new Error(messages.join('. '));
    err.statusCode = 422;
    return next(err);
  }
  req.body = value; // Use sanitized data
  next();
};

module.exports = { registerSchema, loginSchema, validate };
