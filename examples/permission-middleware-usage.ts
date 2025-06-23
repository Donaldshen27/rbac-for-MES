/**
 * Examples of using the advanced permission middleware
 * This file demonstrates various authorization patterns
 */

import { Router } from 'express';
import { authenticate } from '../src/middlewares/auth.middleware';
import {
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
  requireSuperuser,
  requireDynamicPermission,
  requireResourcePermission,
  requireAny,
  auditPermissionCheck
} from '../src/middlewares/permission.middleware';

const router = Router();

// Always require authentication first
router.use(authenticate);

// ============================================
// 1. Basic Permission Checks
// ============================================

// Single permission check
router.get('/reports', 
  requirePermission('report:read'), 
  (req, res) => res.json({ message: 'Reports access granted' })
);

// Multiple permissions (OR) - user needs ANY of these
router.post('/data-export', 
  requirePermission(['data:export', 'admin:manage']), 
  (req, res) => res.json({ message: 'Export started' })
);

// Multiple permissions (AND) - user needs ALL of these
router.delete('/critical-data', 
  requirePermission(['data:delete', 'data:admin'], { requireAll: true }), 
  (req, res) => res.json({ message: 'Data deleted' })
);

// Real-time database permission check
router.post('/sensitive-operation', 
  requirePermission('system:critical', { checkDatabase: true }), 
  (req, res) => res.json({ message: 'Operation completed' })
);

// ============================================
// 2. Role-Based Checks
// ============================================

// Single role
router.get('/admin-dashboard', 
  requireRole('admin'), 
  (req, res) => res.json({ message: 'Admin dashboard' })
);

// Multiple roles
router.get('/management-reports', 
  requireRole(['admin', 'manager', 'supervisor']), 
  (req, res) => res.json({ message: 'Management reports' })
);

// ============================================
// 3. Ownership Checks
// ============================================

// User can only update their own profile OR needs admin permission
router.put('/users/:userId/profile', 
  requireOwnershipOrPermission({
    ownerIdParam: 'userId',
    fallbackPermission: 'user:update'
  }), 
  (req, res) => res.json({ message: 'Profile updated' })
);

// Check ownership from request body
router.post('/posts/:postId/edit', 
  requireOwnershipOrPermission({
    ownerIdField: 'authorId',
    fallbackPermission: 'post:moderate'
  }), 
  (req, res) => res.json({ message: 'Post edited' })
);

// Custom ownership check with async function
router.delete('/orders/:orderId', 
  requireOwnershipOrPermission({
    getUserId: async (req) => {
      // In real app, this would query the database
      // const order = await Order.findByPk(req.params.orderId);
      // return order?.userId;
      return 'user-123'; // Example
    },
    fallbackPermission: 'order:admin'
  }), 
  (req, res) => res.json({ message: 'Order deleted' })
);

// ============================================
// 4. Dynamic Permission Resolution
// ============================================

// Permission based on URL parameters
router.all('/api/:resource/:action', 
  requireDynamicPermission((req) => {
    return `${req.params.resource}:${req.params.action}`;
  }), 
  (req, res) => res.json({ 
    message: `Action ${req.params.action} on ${req.params.resource} allowed` 
  })
);

// Async permission resolution based on resource state
router.put('/documents/:documentId', 
  requireDynamicPermission(async (req) => {
    // In real app, check document status
    // const doc = await Document.findByPk(req.params.documentId);
    // return doc.isLocked ? 'document:force-edit' : 'document:edit';
    const isLocked = false; // Example
    return isLocked ? 'document:force-edit' : 'document:edit';
  }), 
  (req, res) => res.json({ message: 'Document updated' })
);

// ============================================
// 5. Resource-Based Permissions (RESTful)
// ============================================

// Automatically maps HTTP methods to permissions
const productRouter = Router();
productRouter.use(requireResourcePermission('product'));

// These routes automatically require:
productRouter.get('/', (req, res) => res.json([]));        // product:read
productRouter.post('/', (req, res) => res.json({}));       // product:create
productRouter.put('/:id', (req, res) => res.json({}));     // product:update
productRouter.patch('/:id', (req, res) => res.json({}));   // product:update
productRouter.delete('/:id', (req, res) => res.json({}));  // product:delete

router.use('/products', productRouter);

// ============================================
// 6. Complex Authorization Logic
// ============================================

// Allow if ANY condition is met:
// - User owns the resource
// - User has moderator role
// - User has specific permission
router.delete('/user-content/:contentId', 
  requireAny(
    requireOwnershipOrPermission({
      getUserId: async (req) => {
        // Get content owner from database
        return 'content-owner-id';
      },
      fallbackPermission: 'content:delete'
    }),
    requireRole('moderator'),
    requirePermission('content:admin')
  ), 
  (req, res) => res.json({ message: 'Content deleted' })
);

// ============================================
// 7. Superuser Only Operations
// ============================================

router.post('/system/maintenance-mode', 
  requireSuperuser, 
  (req, res) => res.json({ message: 'Maintenance mode activated' })
);

// ============================================
// 8. Audit Logging
// ============================================

// Log sensitive operations
router.post('/users/:userId/reset-password', 
  auditPermissionCheck('reset-password', 'user'),
  requirePermission('user:reset-password'), 
  (req, res) => res.json({ message: 'Password reset' })
);

// Combine audit with complex checks
router.delete('/financial-records/:recordId', 
  auditPermissionCheck('delete', 'financial-record'),
  requireAny(
    requirePermission('finance:admin'),
    requireRole('cfo')
  ), 
  (req, res) => res.json({ message: 'Record deleted' })
);

// ============================================
// 9. Nested Resource Permissions
// ============================================

// Check parent and child resource permissions
router.put('/projects/:projectId/tasks/:taskId', 
  requireDynamicPermission(async (req) => {
    // Could check project membership here
    return ['project:read', 'task:update'];
  }, { requireAll: true }), 
  (req, res) => res.json({ message: 'Task updated' })
);

// ============================================
// 10. Time-Based Permissions
// ============================================

// Permission that changes based on time
router.post('/reports/generate', 
  requireDynamicPermission((req) => {
    const hour = new Date().getHours();
    // Require special permission during off-hours
    return hour < 8 || hour > 18 
      ? 'report:generate-offhours' 
      : 'report:generate';
  }), 
  (req, res) => res.json({ message: 'Report generated' })
);

// ============================================
// 11. Conditional Middleware Application
// ============================================

// Apply different permissions based on query parameters
router.get('/data', 
  requireDynamicPermission((req) => {
    if (req.query.sensitive === 'true') {
      return 'data:read-sensitive';
    }
    return 'data:read';
  }), 
  (req, res) => res.json({ message: 'Data retrieved' })
);

// ============================================
// 12. Hierarchical Permissions
// ============================================

// Check organization hierarchy
router.put('/organizations/:orgId/settings', 
  requireDynamicPermission(async (req) => {
    // In real app, check if user is org admin
    const isOrgAdmin = true; // Example
    if (isOrgAdmin) {
      return `org:${req.params.orgId}:admin`;
    }
    return 'org:super-admin';
  }), 
  (req, res) => res.json({ message: 'Settings updated' })
);

export default router;