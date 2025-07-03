import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import Debug from "debug";
import { MCPSession, MCPSessionInterface } from '../models/MCPSession';
import { ca, tr } from "zod/v4/locales";
import { MCPClientInfo, MCPSessionInfo } from "../types/MCP";
const infoLogger = Debug("MCPSessionService:log");
const errorLogger = Debug("MCPSessionService:error");

export class MCPSessionService {    
    private static instance: MCPSessionService | null = null;
    private transports: { [sessionId: string]: StreamableHTTPServerTransport };
    
    private constructor() {
        this.transports = {};
        
        // Bind the session management methods to the instance
        this.createSession = this.createSession.bind(this);
    }   

    public static getInstance(): MCPSessionService {
        if (!MCPSessionService.instance) 
            MCPSessionService.instance = new MCPSessionService();
        
        return MCPSessionService.instance;
    }

    /**
     * Function to create a session.
     * This function checks if a session with the given sessionId already exists.
     * If it does, it updates the session's status and last activity time.
     * If it doesn't, it creates a new session with the provided sessionId.
     * @param sessionId 
     * @param transport 
     * @param userId 
     * @param clientInfo 
     * @returns 
     */
    public async createSession(sessionId: string, transport: StreamableHTTPServerTransport, userId?: string, clientInfo?: MCPClientInfo): Promise<MCPSessionInterface> {
        try{
            //STEP 1 -- Look for existing session
            const existingSession = await MCPSession.findOne({ sessionId });
            if(existingSession) {
                //STEP 1.1 -- Check if session belongs to the same user
                if (userId && existingSession.userId && existingSession.userId !== userId) {
                    errorLogger(`❌ Session ${sessionId} belongs to different user`);
                    throw new Error('Session belongs to different user');
                }

                //STEP 1.2 -- Handle existing session by looking its status
                switch(existingSession.status) {
                    case 'active':
                        existingSession.clientInfo = clientInfo || existingSession.clientInfo;
                        existingSession.lastActivity = new Date();
                        existingSession.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

                        //STEP 1.3 -- Save updated session
                        infoLogger(`ℹ️ Updating session with ID: ${sessionId}`);
                        this.transports[sessionId] = transport;
                        await existingSession.save();
                        infoLogger(`✅ Session with ID: ${sessionId} saved successfully`);
                        return existingSession;  
                    case 'closed':
                    case 'expired':
                        infoLogger(`ℹ️ Session session with ID ${sessionId} is ${existingSession.status}. Generating new session...`);
                        break;
                    default:
                        errorLogger(`❌ Unknown session status for session ${sessionId}: ${existingSession.status}`);
                        throw new Error('Unknown session status');
                }
            }   

            //STEP 2 -- Create new session
            infoLogger(`ℹ️ Creating new session with ID: ${sessionId}`);
            this.transports[sessionId] = transport;
            const newSession = new MCPSession({
                sessionId,
                userId: userId,
                status: 'active',
                clientInfo: clientInfo,
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            await newSession.save();
            infoLogger(`✅ New session created with ID: ${sessionId}`);
            return newSession;
        }
        catch (error) {
            if(this.transports[sessionId]){
                this.transports[sessionId].close();
                delete this.transports[sessionId];
            }
            errorLogger(`❌ Error creating new session ${sessionId}:`, error);
            throw error;
        }       
    }


    /**
     * Function to close a session.
     * This function checks if a session with the given sessionId exists.
     * If it does, it updates the session's status to 'closed', updates the last activity time, and removes the transport from the active transports.
     * If the session does not exist or belongs to a different user, it returns false.  
     * @param sessionId 
     * @param userId 
     * @returns 
     */
    public async closeSession(sessionId: string, userId?: string): Promise<boolean>{
        try {
            //STEP 1 -- Check if session exists
            infoLogger(`ℹ️ Closing session with ID: ${sessionId}`);
            const session = await MCPSession.findOne({ sessionId });
            if (!session) {
                errorLogger(`❌ Session with ID: ${sessionId} not found`);
                return false;
            }

            //STEP 2 -- Check if session belongs to the same user
            if (userId && session.userId && session.userId !== userId) {
                errorLogger(`❌ Session ${sessionId} belongs to different user`);
                return false;
            }

            //STEP 3 -- Update session status and last activity
            session.status = 'closed';
            session.lastActivity = new Date();
            session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 
            await session.save();
            infoLogger(`✅ Session with ID: ${sessionId} closed successfully`);

            //STEP 4 -- Remove transport from active transports 
            this.transports[sessionId].close();
            delete this.transports[sessionId];
            infoLogger(`ℹ️ Transport for session ${sessionId} removed from active transports`);
            return true;  
        }
        catch (error) {
            errorLogger(`❌ Error closing session ${sessionId}:`, error);
            return false;
        }       
    }


    /**
     * Function to get an active session by sessionId.
     * This function checks if a session with the given sessionId exists and is active.
     * If it does, it returns the session and its associated transport.
     * If the session does not exist, is not active, or belongs to a different user, it returns null.
     * @param sessionId 
     * @param userId 
     * @returns 
     */
    public async getActiveSession(sessionId: string, userId?: string): Promise<MCPSessionInfo> {
        try {
            //STEP 1 -- Look for active session
            infoLogger(`ℹ️ Fetching active sessions`);
            const session = await MCPSession.findOne({ sessionId });
            if (!session) {
                infoLogger(`🔍 Session not found: ${sessionId}`);
                return { session: null, transport: null };
            }

            //STEP 2 -- Look if returned session is for the same user
            if (userId && session.userId && session.userId !== userId) {
                errorLogger(`❌ Session ${sessionId} access denied: belongs to different user`);
                return { session: null, transport: null };
            }
            
            //STEP 3 -- Check if session is active
            if (session.status !== 'active') {
                infoLogger(`🔍 Session ${sessionId} is not active: current status is ${session.status}`);
                return { session: null, transport: null };
            }

            //STEP 3 -- Check if session is expired
            if (session.expiresAt && session.expiresAt < new Date()) {
                infoLogger(`🔍 Session ${sessionId} is expired: expires at ${session.expiresAt}`);
                return { session: null, transport: null };
            }

            //STEP 4 -- Look if session transport exists, if not, mark session as closed
            infoLogger(`ℹ️ Session ${sessionId} is active, fetching transport`);
            const transport = this.transports[sessionId];
            if (!transport) {
                infoLogger(`⚠️ Transport not found for session ${sessionId}, marking as closed`);
                session.status = 'closed';
                await session.save();
                return { session: null, transport: null };
            }

            //STEP 5 -- Update last activity time and return session and transport
            session.lastActivity = new Date();
            await session.save();
            infoLogger(`✅ Session ${sessionId} is active and transport is available`);
            return { session, transport };
        } 
        catch (error) {
            errorLogger(`❌ Error fetching active sessions:`, error);
            throw error;
        }
    }


    /**
     * Function to clean up expired sessions.
     * This function deletes all sessions that have expired based on their expiresAt field.
     * It also removes the associated transports from the active transports.
     * @returns Returns true if cleanup was successful, false otherwise.
     */
    public async cleanUpExpiredSessions(): Promise<boolean> {
        try {
            //STEP 1 -- Delete expired sessions
            infoLogger(`ℹ️ Cleaning up expired sessions`);
            const now = new Date();
            const result = await MCPSession.deleteMany({ expiresAt: { $lt: now } });
            infoLogger(`✅ Cleaned up ${result.deletedCount} expired sessions`);

            //STEP 2 -- Remove expired transports
            if(result.deletedCount > 0) {
                infoLogger(`🧹 Cleaned up ${result.deletedCount > 0} expired sessions`);
                infoLogger(`ℹ️ Removing expired transports`);
                for (const sessionId in this.transports) {  
                    const transport = this.transports[sessionId];
                    if (transport && transport.sessionId) {
                        infoLogger(`ℹ️ Removing transport for expired session ${sessionId}`);
                        this.transports[sessionId].close();
                        delete this.transports[sessionId];
                    }
                }
                infoLogger(`✅ Transport cleanup completed successfully`);
            }

            //STEP 3 -- Log success message
            infoLogger(`✅ Sessions cleanup completed successfully`);
            return true;
        } 
        catch (error) {
            errorLogger(`❌ Error cleaning up expired sessions:`, error);
            return false;
        }
    }
}