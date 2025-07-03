
import { Schema, model, Document } from 'mongoose';

export interface MCPSessionInterface extends Document {
  sessionId: string;
  userId?: string; 
  status: 'active' | 'closed' | 'expired';
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
  };
  metadata?: Record<string, any>;
}


/**
 * Schema for Model Context Protocol (MCP) sessions.
 * Each session represents a unique interaction with the MCP server, and has a time-to-live (TTL) for automatic cleanup.
 */
const MCPSessionSchema = new Schema<MCPSessionInterface>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: false,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'expired'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), 
    index: { expireAfterSeconds: 0 }
  },
  clientInfo: {
    userAgent: String,
    ipAddress: String
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});


MCPSessionSchema.index({ userId: 1, status: 1 });
MCPSessionSchema.index({ status: 1, expiresAt: 1 });

export const MCPSession = model<MCPSessionInterface>('MCPSession', MCPSessionSchema);