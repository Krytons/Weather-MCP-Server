import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthTokenPayload } from '../interfaces/Auth';


export class AuthMiddleware {
    private authService : AuthService;

    constructor(){
        this.authService = new AuthService();
    }

    public authenticate(req: Request, res: Response, next: NextFunction) : void{
        try{
            //STEP 1 -- Verify authorization headers
            let authHeader = req.headers.authorization;
            if(!authHeader){
                res.status(401).json({
                    uccess: false,
                    message: 'Authorization header is required'
                });
                return;
            }

            //STEP 2 -- Check Bearer Token
            let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            if(!token){
                res.status(401).json({
                    uccess: false,
                    message: 'Token is required'
                });
                return;
            }

            //STEP 3 -- Verify Bearer Token
            let payload : AuthTokenPayload | null = this.authService.verifyToken(token);
            if(!payload){
                res.status(401).json({
                    error: "Unauthorized",
                    message: "Invalid or expired token"
                });
                return;
            }

            //STEP 4 -- Enhance response locals by adding user data
            res.locals.user = {
                userID : payload.userID,
                userEmail : payload.email
            }
            return next();
        }
        catch(error){
            console.error('[AUTH-MIDDLEWARE] An unhandled error occurred: ', error);
            res.status(500).json({
                success: false,
                message: 'Authentication error'
            })
        }
    }
}