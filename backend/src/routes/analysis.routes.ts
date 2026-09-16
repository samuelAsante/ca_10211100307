import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AdminController } from '../controllers/admin.controller';
import { InsightController } from '../controllers/insight.controller';
import { DiagnosticsController } from '../controllers/diagnostics.controller';
import { getSession } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes here (mostly admin)
router.use(getSession);

// Analytics
router.get('/analytics/stats', AnalyticsController.getStats);
router.get('/admin/metrics', AnalyticsController.getMetrics);

// Admin Batches
router.get('/admin/batches', AdminController.getBatches);
router.get('/admin/jobs', AdminController.getJobs);
router.get('/admin/dead-letter-queue', AdminController.getDeadLetterQueue);
router.post('/admin/batches/:batchId/analyze', AdminController.triggerBatchAnalysis);

// Service Diagnostics
router.get('/admin/diagnostics/overview', DiagnosticsController.getOverview);
router.post('/admin/diagnostics/paystack', DiagnosticsController.testPaystack);
router.post('/admin/diagnostics/email', DiagnosticsController.testEmail);
router.post('/admin/diagnostics/ai', DiagnosticsController.testAI);
router.post('/admin/diagnostics/database', DiagnosticsController.testDatabase);
router.post('/admin/diagnostics/cloudinary', DiagnosticsController.testCloudinary);

// Insights
router.get('/insights', InsightController.getInsights);

export default router;
