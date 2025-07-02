import {createHash, randomBytes, timingSafeEqual} from 'crypto';
import { AuthResponse, AuthTokenPayload } from '../interfaces/Auth';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

import Debug from "debug";
const infoLogger = Debug("AuthService:log");
const errorLogger = Debug("AuthService:error");


export class AuthService{
    private readonly jwtSecret: string;
    private readonly jwtExpiresIn: number;

    constructor(){
        this.jwtSecret = process.env.JWT_SECRET || 'sample_secret_key'
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 3600
    }

    
    /**
     * Provides SHA256 Hashing for API Keys
     * @param key 
     * @returns 
     */
    private hashKey(key : string) : string {
        return createHash('sha256').update(key, 'utf8').digest('hex');
    }


    /**
     * Executes a comparison between two hash string
     * @param firstHash 
     * @param secondHash 
     * @returns 
     */
    private compareHash(firstHash : string, secondHash : string) : boolean {
        //STEP 1 -- Compare hash lenght
        if(firstHash.length !== secondHash.length)
            return false;

        //STEP 2 -- Compare buffers
        try{
            return timingSafeEqual(Buffer.from(firstHash, 'hex'), Buffer.from(secondHash, 'hex'));
        }
        catch(error){
            errorLogger('❌ Hashing comparison error:', error);
            return false;
        }
    }


    /**
     * Executes authentication by looking at a valid customer inside current DB
     * @param email 
     * @param apiKey 
     * @returns 
     */
    public async authenticate(email : string, apiKey : string): Promise<AuthResponse>{
        try{
            //STEP 1 -- Check required parameters
            infoLogger(`ℹ️ Authenticating user with email: ${email}`);
            if(!email || !apiKey)
                return {
                    success: false,
                    message: 'Missing email or apiKey',
                }

            //STEP 2 -- Look for a user in database
            let authUser = await User.findOne({
                email: email.toLocaleLowerCase(),
                isActive: true
            })
            if(!authUser)
                return {
                    success: false,
                    message: 'Invalid credentials or user not found',
                }

            //STEP 3 -- Verify API Key
            let hashedKey = this.hashKey(apiKey);
            if(!this.compareHash(hashedKey, authUser.apiKey))
                return {
                    success: false,
                    message: 'Invalid credentials or user not found',
                }

            //STEP 4 -- Generate JWT 
            let jwtPayload : AuthTokenPayload = {
                userID: authUser._id.toString(),
                email: authUser.email
            }
            let token = jwt.sign(jwtPayload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn
            } as jwt.SignOptions);

            return {
                success: true,
                token: token,
                message: 'Authentication successful',
                expiresIn: this.jwtExpiresIn
            }
        }
        catch(error){
            errorLogger('❌ Authenticate error: ', error);
            return {
                success: false,
                message: 'Internal authentication error',
            }
        }
    }


    /**
     * Verifies a given token
     * @param token 
     * @returns 
     */
    public verifyToken(token : string): AuthTokenPayload | null {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
            return decoded;
        } catch (error) {
            errorLogger('❌ Token verification error:', error);
            return null;
        }
    }
}