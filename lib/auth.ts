import * as jose from 'jose';
import { NextRequest } from 'next/server';

interface UserPayload {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Verifies a JWT token and returns the decoded payload
 */
export async function verifyToken(token: string): Promise<UserPayload> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'my-umkm',
      audience: 'user',
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extracts the token from the request headers or cookies
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Then check cookies
  const token = request.cookies.get('token')?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * Middleware to protect API routes with JWT authentication
 */
export async function protectApiRoute(request: NextRequest) {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return Response.json(
      { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }

  try {
    const user = await verifyToken(token);
    return { user };
  } catch (error) {
    return Response.json(
      { error: 'Sesi telah berakhir. Silakan login kembali.' },
      { status: 401 }
    );
  }
}

/**
 * Generates a new JWT token
 */
export async function generateToken(payload: UserPayload): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  
  return new jose.SignJWT({
    userId: payload.userId,
    email: payload.email,
    ...(payload.name && { name: payload.name })
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('my-umkm')
    .setAudience('user')
    .setExpirationTime('30d')
    .sign(secret);
}

/**
 * Sets the authentication token in the response cookies
 */
export function setAuthCookie(response: Response, token: string): void {
  response.headers.append(
    'Set-Cookie',
    `token=${token}; Path=/; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }; Max-Age=${30 * 24 * 60 * 60}` // 30 days
  );
}

/**
 * Clears the authentication cookie
 */
export function clearAuthCookie(response: Response): void {
  response.headers.append(
    'Set-Cookie',
    'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
  );
}
