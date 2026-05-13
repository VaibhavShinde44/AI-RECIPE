import express from 'express';  
const router = express.Router();

import * as authController from '../controllers/authController';
import authMiddleware from '../middleware/auth';


// All routes are protected by authMiddleware
router.use(authMiddleware);

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/preferences', authController.updatePreferences);
router.put('/password', authController.updatePassword);
router.delete('/delete', authController.deleteAccount);

export default router;