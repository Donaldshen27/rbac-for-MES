import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import resourceRoutes from './resource.routes';
import menuRoutes from './menu.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API version
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    api: 'RBAC System API'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/resources', resourceRoutes);
router.use('/menus', menuRoutes);

export default router;