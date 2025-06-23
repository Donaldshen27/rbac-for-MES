import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, refreshTokenMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema
} from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', refreshTokenMiddleware, AuthController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Profile management
router.get('/me', AuthController.getProfile);
router.put('/me', validate(updateProfileSchema), AuthController.updateProfile);

// Password management
router.post('/change-password', validate(changePasswordSchema), AuthController.changePassword);

// Logout
router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAll);

// Email verification
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);

// Session management
router.get('/sessions', AuthController.getSessions);
router.delete('/sessions/:sessionId', AuthController.revokeSession);

// Token validation (for microservices)
router.post('/validate', AuthController.validateToken);

export default router;