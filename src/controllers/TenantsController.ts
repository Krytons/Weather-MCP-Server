import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export class TenantsController {
    private authService : AuthService;

    constructor() {
       this.authService = AuthService.getInstance();
    }      
    
    public async authenticate(req: Request, res: Response, next: NextFunction) : Promise<void> {
        //STEP 1 -- Extract email and API key from request body
        const { email, apiKey } = req.body;

        //STEP 2 -- Get a JWT token for the tenant
        try {
            const authResponse = await this.authService.authenticate(email, apiKey);
            if (!authResponse.success) {
                res.status(401).json({
                    success: false,
                    message: authResponse.message
                });
                return;
            }

            //STEP 3 -- Return the JWT token as AuthResponse
            res.status(200).json(authResponse);
            next();
        } 
        catch (error) {
            console.error('[TENTANT-CONTROLLER] ❌ Authenticate error: ', error);
            res.status(500).json({
                success: false,
                message: 'Internal authentication error'
            });  
            return;
        }          
    }
}