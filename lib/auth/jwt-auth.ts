import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT Authentication Strategy Pattern

export interface AuthPayload {
  userId: string;
  email: string;
  restaurantName: string;
  registrationNumber: string;
  iat?: number;
  exp?: number;
}

export interface AuthStrategy {
  generateToken(payload: AuthPayload): string;
  verifyToken(token: string): AuthPayload | null;
  extractTokenFromRequest(request: NextRequest): string | null;
}

export class JWTAuthStrategy implements AuthStrategy {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET!;
    this.expiresIn = '7d'; // Token expires in 7 days
    
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  generateToken(payload: AuthPayload): string {
    try {
      return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
    } catch (error) {
      console.error('Error generating JWT token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  verifyToken(token: string): AuthPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as AuthPayload;
      return decoded;
    } catch (error) {
      console.error('Error verifying JWT token:', error);
      return null;
    }
  }

  extractTokenFromRequest(request: NextRequest): string | null {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from cookies
    const tokenFromCookie = request.cookies.get('auth-token')?.value;
    if (tokenFromCookie) {
      return tokenFromCookie;
    }

    return null;
  }
}

// Auth Context using Strategy Pattern
export class AuthContext {
  private strategy: AuthStrategy;

  constructor(strategy: AuthStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: AuthStrategy) {
    this.strategy = strategy;
  }

  generateToken(payload: AuthPayload): string {
    return this.strategy.generateToken(payload);
  }

  verifyToken(token: string): AuthPayload | null {
    return this.strategy.verifyToken(token);
  }

  extractTokenFromRequest(request: NextRequest): string | null {
    return this.strategy.extractTokenFromRequest(request);
  }

  authenticateRequest(request: NextRequest): AuthPayload | null {
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      return null;
    }
    return this.verifyToken(token);
  }
}

// Factory for creating auth instances
export class AuthFactory {
  static createJWTAuth(): AuthContext {
    const strategy = new JWTAuthStrategy();
    return new AuthContext(strategy);
  }
}

// Client-side auth utilities
export class ClientAuth {
  private static TOKEN_KEY = 'auth-token';

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Also set as cookie for server-side access
      document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('restaurantData'); // Remove old data
      // Remove cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic token format check (not full verification on client)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  static getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}