import { Router } from 'express';
import Joi from 'joi';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { reports, users } from '../db/schema';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, CreateReportRequest, GetReportsQuery } from '../types';

const router = Router();

// Validation schemas
const createReportSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  noise_db: Joi.number().min(0).max(200).required(),
  noise_type: Joi.string().valid('traffic', 'construction', 'events', 'industrial', 'other').required(),
  description: Joi.string().optional(),
  media_urls: Joi.array().items(Joi.string()).optional(),
  is_anonymous: Joi.boolean().required(),
});

const getReportsSchema = Joi.object({
  user_id: Joi.string().uuid().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().min(0).max(100).optional(),
  limit: Joi.number().min(1).max(100).default(50),
  offset: Joi.number().min(0).default(0),
  noise_type: Joi.string().valid('traffic', 'construction', 'events', 'industrial', 'other').optional(),
});

// Get all reports with optional filtering
router.get('/', async (req, res) => {
  try {
    const { error, value } = getReportsSchema.validate(req.query);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const query: GetReportsQuery = value;
    let whereConditions: any[] = [];

    // Filter by user_id
    if (query.user_id) {
      whereConditions.push(eq(reports.user_id, query.user_id));
    }

    // Filter by noise_type
    if (query.noise_type) {
      whereConditions.push(eq(reports.noise_type, query.noise_type));
    }

    // Filter by location and radius
    if (query.latitude && query.longitude && query.radius) {
      const lat = query.latitude;
      const lng = query.longitude;
      const radius = query.radius;
      
      // Using Haversine formula for distance calculation
      whereConditions.push(
        sql`(
          6371 * acos(
            cos(radians(${lat})) * cos(radians(${reports.latitude})) * 
            cos(radians(${reports.longitude}) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(${reports.latitude}))
          )
        ) <= ${radius}`
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const reportsData = await db
      .select({
        id: reports.id,
        user_id: reports.user_id,
        latitude: reports.latitude,
        longitude: reports.longitude,
        noise_db: reports.noise_db,
        noise_type: reports.noise_type,
        description: reports.description,
        media_urls: reports.media_urls,
        is_anonymous: reports.is_anonymous,
        created_at: reports.created_at,
        updated_at: reports.updated_at,
        user_name: users.name,
      })
      .from(reports)
      .leftJoin(users, eq(reports.user_id, users.id))
      .where(whereClause)
      .orderBy(sql`${reports.created_at} DESC`)
      .limit(query.limit!)
      .offset(query.offset!);

    const response: ApiResponse = {
      success: true,
      data: reportsData.map(report => ({
        ...report,
        created_at: report.created_at.toISOString(),
        updated_at: report.updated_at.toISOString(),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Create new report
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { error, value } = createReportSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const reportData: CreateReportRequest = value;

    // For anonymous reports, user_id should be null
    const userId = reportData.is_anonymous ? null : req.user!.userId;

    const [newReport] = await db
      .insert(reports)
      .values({
        user_id: userId,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        noise_db: reportData.noise_db,
        noise_type: reportData.noise_type,
        description: reportData.description,
        media_urls: reportData.media_urls,
        is_anonymous: reportData.is_anonymous,
      })
      .returning();

    const response: ApiResponse = {
      success: true,
      data: {
        ...newReport,
        created_at: newReport.created_at.toISOString(),
        updated_at: newReport.updated_at.toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

export default router;
