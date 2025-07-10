export interface AuthTokenPayload{
    tenantId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    message: string;
    expiresIn?: number;
}