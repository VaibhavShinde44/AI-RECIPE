import express from 'express';  
const router = express.Router();

import * as authController from '../controllers/authController';
import authMiddleware from '../middleware/auth';


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/password', authController.updatePassword);


router.get('/profile', authMiddleware, authController.getProfile);

export default router;