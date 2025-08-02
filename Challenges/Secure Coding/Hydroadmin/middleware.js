/**
 * PATCHED FILE utils/middleware.js
 *
 * Vulnerability: Weak Rate Limiting
 *
 * The original rate-limiting configuration was too permissive. It allowed 10
 * requests per IP address every minute. This threshold is high enough to make a
 * brute-force attack feasible, especially when combined with the GraphQL
 * batching vulnerability. Using only the IP address as the key also makes it
 * possible for an attacker to bypass the limit by using different proxy servers.
 *
 * Fix:
 *
 * The rate-limiting rules have been made significantly stricter:
 * 1. The window has been increased to 5 minutes (`windowMs`).
 * 2. The maximum number of requests has been reduced to 5 (`max`).
 * 3. The `keyGenerator` now creates a more specific key by combining the user's
 * IP address with an identifier for the action being performed (e.g.,
 * 'verify-pin'). This prevents an attacker from using their request quota
 * for one action to brute-force another.
 * 4. A clear error message is now sent to the user when the rate limit is
 * exceeded.
 */
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import express from 'express';

// Rate limiting
export const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a combination of IP and the attempted action for a more specific key
    return req.ip + (req.body.query.includes('verifyAccessPin') ? '-verify-pin' : '');
  }, 
  message: {
    errors: [{
      message: 'Too many requests, please try again after 5 minutes.'
    }]
  }
});

// Session configuration
export const sessionConfig = session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Middleware to check control room access
export function requireControlRoomAccess(req, res, next) {
  if (req.session.controlRoomAccess) {
    next();
  } else {
    res.redirect('/challenge/pin-access');
  }
}

// Basic middleware setup
export function setupBasicMiddleware(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}