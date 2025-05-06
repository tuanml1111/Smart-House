const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes
router.use(authMiddleware.protect);
router.get('/me', userController.getMe);
router.put('/me', userController.updateUser);

module.exports = router;