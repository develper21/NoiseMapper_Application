import { Router } from 'express';
import Joi from 'joi';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword, verifyPassword, generateToken, createSession, AuthError } from '../utils/auth';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../types';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Register endpoint
router.post('/signup', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { email, password, name }: RegisterRequest = value;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      } as ApiResponse);
      return;
    }

    // Create new user
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password_hash: passwordHash,
        name,
      })
      .returning();

    // Generate token and create session
    const token = generateToken(newUser.id);
    await createSession(newUser.id, token);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          avatar_url: newUser.avatar_url,
          created_at: newUser.created_at.toISOString(),
          updated_at: newUser.updated_at.toISOString(),
        },
        token,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Login endpoint
router.post('/signin', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { email, password }: LoginRequest = value;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    // Generate token and create session
    const token = generateToken(user.id);
    await createSession(user.id, token);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString(),
        },
        token,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

export default router;
