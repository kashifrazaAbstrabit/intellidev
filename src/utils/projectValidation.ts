import Joi from "joi";
export const projectValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Project name must be a string.",
    "string.empty": "Project name cannot be empty.",
    "string.min": "Project name must be at least 3 characters long.",
    "string.max": "Project name cannot exceed 100 characters.",
    "any.required": "Project name is required.",
  }),
  description: Joi.string().min(10).max(500).required().messages({
    "string.base": "Description must be a string.",
    "string.empty": "Description cannot be empty.",
    "string.min": "Description must be at least 10 characters long.",
    "string.max": "Description cannot exceed 500 characters.",
    "any.required": "Description is required.",
  }),
  status: Joi.string()
    .valid("under_discuss", "completed", "suspended", "maintenance")
    .required()
    .messages({
      "string.base": "Status must be a string.",
      "any.only":
        "Status must be one of: under_discuss, completed, suspended, maintenance.",
      "any.required": "Status is required.",
    }),
  client_id: Joi.number().integer().positive().required().messages({
    "number.base": "Client ID must be a number.",
    "number.integer": "Client ID must be an integer.",
    "number.positive": "Client ID must be a positive number.",
    "any.required": "Client ID is required.",
  }),
  assigned_people: Joi.array()
    .items(
      Joi.number().integer().positive().messages({
        "number.base": "Each developer ID must be a number.",
        "number.integer": "Each developer ID must be an integer.",
        "number.positive": "Each developer ID must be a positive number.",
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Assigned people must be an array.",
      "array.min": "At least one developer must be assigned.",
      "any.required": "Assigned people are required.",
    }),
});
