import { validationResult } from 'express-validator';

// Collect validation errors and return a consistent response shape
export const validate = (rules) => {
    return async (req, res, next) => {
        await Promise.all(rules.map((rule) => rule.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request payload',
                errors: errors.array().map(({ msg, param }) => ({ field: param, message: msg }))
            });
        }

        next();
    };
};
