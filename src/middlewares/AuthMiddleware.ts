import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthTokenPayload } from '../interfaces/Auth';

import Debug from "debug";
const infoLogger = Debug("AuthMiddlewares:log");
const errorLogger = Debug("AuthMiddlewares:error");

/**
 * Singleton AuthMiddleware class for handling authentication in Express.js applications.
 */
export class AuthMiddleware {
    private static instance: AuthMiddleware;
    private authService : AuthService;

    private constructor(){
        this.authService = AuthService.getInstance();

        // Bind the authenticate method to the instance
        this.authenticate = this.authenticate.bind(this);
    }
    
    public static getInstance(): AuthMiddleware {
        if (!AuthMiddleware.instance) 
            AuthMiddleware.instance = new AuthMiddleware();
        
        return AuthMiddleware.instance;
    }

    /**
     * Middleware function to authenticate requests using Bearer tokens.
     * This function checks for the presence of an Authorization header,
     * verifies the Bearer token, and enhances the response locals with user data.
     * If the token is valid, it allows the request to proceed to the next middleware or route handler.
     * If the token is invalid or missing, it responds with a 401 Unauthorized status and an error message.
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    public authenticate(req: Request, res: Response, next: NextFunction) : void{
        infoLogger(`ℹ️ Received request for authentication`);
        try{
            //STEP 0 -- Check if callee is an MCP request
            const isMCPRequest = req.path.includes('/mcp');

            //STEP 1 -- Verify authorization headers
            let authHeader = req.headers.authorization;
            if (!authHeader) {
                if (isMCPRequest) {
                    res.status(401).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32001,
                            message: 'Authorization header is required'
                        },
                        id: req?.body?.id || null
                    });
                } 
                else {
                    res.status(401).json({
                        success: false,
                        message: 'Authorization header is required'
                    });
                }
                return;
            }

            //STEP 2 -- Check Bearer Token
            let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            if (!token || token.trim() === '') {
                if (isMCPRequest) {
                    res.status(401).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32001,
                            message: 'Token is required'
                        },
                        id: req?.body?.id || null
                    });
                } 
                else {
                    res.status(401).json({
                        success: false,
                        message: 'Token is required'
                    });
                }
                return;
            }

            //STEP 3 -- Verify Bearer Token
            let payload: AuthTokenPayload | null = this.authService.verifyToken(token);
            if (!payload) {
                if (isMCPRequest) {
                    res.status(401).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32001,
                            message: 'Invalid or expired token'
                        },
                        id: req?.body?.id || null
                    });
                } else {
                    res.status(401).json({
                        error: "Unauthorized",
                        message: "Invalid or expired token"
                    });
                }
                return;
            }

            //STEP 4 -- Enhance response locals by adding user data
            infoLogger(`✅ Auth was successful for user: ${payload.tenantId} (${payload.email})`);
            res.locals.user = {
                tenantId: payload.tenantId,
                userEmail: payload.email
            }
            return next();
        }
        catch(error){
            errorLogger('❌ An unhandled error occurred: ', error);
            res.status(500).json({
                success: false,
                message: 'Authentication error'
            })
        }
    }
}