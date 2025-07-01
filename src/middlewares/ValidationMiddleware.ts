import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export class ValidationMiddleware {
    
    /**
     * Function to check validation errors for MCP requests.
     * This function uses the `express-validator` library to validate the request body.
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    static checkMCPValidation(req: Request, res: Response, next: NextFunction): void {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32600,
                    message: 'Invalid Request',
                    data: errors.array()
                },
                id: req?.body?.id || null
            });
            return; 
        }
        next();
    }

    /**
     * Function to check standard validation errors.
     * This function uses the `express-validator` library to validate the request body.
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    static checkStandardValidation(req: Request, res: Response, next: NextFunction): void {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        next();
    }
}