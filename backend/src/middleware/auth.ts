// Re-export auth middleware from utils for consistency
export {
  authenticateToken,
  requireSeller,
  requireBuyer,
  AuthenticatedRequest,
  JWTPayload
} from '../utils/auth'