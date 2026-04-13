import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth';
import { invalidateSession } from './utils/auth';
import authRoutes from './routes/auth';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'exp://10.95.127.78:8081'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NoiseMapper API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/user', usersRoutes);

// Sign out endpoint
app.post('/api/auth/signout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await invalidateSession(token);
    }

    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`NoiseMapper API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

export default app;
