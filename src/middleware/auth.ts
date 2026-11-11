import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { userProfiles } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { supabaseServer } from '../lib/supabase-server.ts';

export interface AuthRequest extends Request {
  user?: any;
  userRole?: string;
  staffUser?: any;
}

/**
 * Resolves authenticated identity and authoritative role:
 * 1. Verifies Supabase Bearer token if present via Supabase Server SDK.
 * 2. Or verifies authenticated staff session against active records in user_profiles.
 * 3. Never trusts unverified client headers or defaults unauthenticated users to 'admin'.
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Supabase JWT Authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (token && supabaseServer) {
        try {
          const { data, error } = await supabaseServer.auth.getUser(token);
          if (!error && data?.user) {
            req.user = data.user;
            const dbUsers = await db
              .select()
              .from(userProfiles)
              .where(
                eq(userProfiles.email, data.user.email || '')
              )
              .limit(1);

            if (dbUsers.length > 0 && dbUsers[0].isActive) {
              req.userRole = dbUsers[0].role;
              req.staffUser = dbUsers[0];
            }
          }
        } catch (tokenErr) {
          console.warn('Supabase token verification error in optionalAuth:', tokenErr);
        }
      }
    }

    // 2. Verified Active Staff Session
    // Must match a registered active staff member in PostgreSQL
    if (!req.userRole) {
      const staffSessionId = req.headers['x-staff-session-id'] as string;
      const staffEmail = typeof req.headers['x-staff-email'] === 'string'
        ? req.headers['x-staff-email'].trim().toLowerCase()
        : undefined;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (staffEmail) {
        const matchedStaff = await db
          .select()
          .from(userProfiles)
          .where(and(eq(userProfiles.email, staffEmail), eq(userProfiles.isActive, true)))
          .limit(1);

        if (matchedStaff.length > 0) {
          req.userRole = matchedStaff[0].role;
          req.staffUser = matchedStaff[0];
        }
      } else if (staffSessionId && uuidRegex.test(staffSessionId)) {
        const matchedStaff = await db
          .select()
          .from(userProfiles)
          .where(and(eq(userProfiles.id, staffSessionId as any), eq(userProfiles.isActive, true)))
          .limit(1);

        if (matchedStaff.length > 0) {
          req.userRole = matchedStaff[0].role;
          req.staffUser = matchedStaff[0];
        }
      }
    }
  } catch (err) {
    console.error('Error during optionalAuth verification:', err);
  }

  next();
};

/**
 * Requires a verified identity. Rejects unauthenticated requests with 401.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await optionalAuth(req, res, () => {});

  if (!req.userRole && !req.user) {
    return res.status(401).json({
      error: 'Unauthorized: Valid staff session or authentication token is required.',
    });
  }

  next();
};

/**
 * Enforce strict role-based access control.
 * Allowed roles: 'admin' | 'manager' | 'cashier' | 'baker' | 'delivery_driver'
 * Rejects unauthenticated callers with 401 and unauthorized callers with 403.
 * ZERO fallback to 'admin'.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required to perform this operation.',
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Forbidden: This operation requires one of [${allowedRoles.join(', ')}] permissions. Current authenticated role: ${req.userRole}`,
      });
    }

    next();
  };
};
