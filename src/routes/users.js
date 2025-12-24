const express = require('express');
const { userController } = require('../controllers');
const { verifyFirebaseToken } = require('../middlewares');
const { validate } = require('../utils');
const { bootstrapSchema, updateProfileSchema } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// POST /users/bootstrap
router.post('/bootstrap', validate(bootstrapSchema), userController.bootstrap.bind(userController));

// GET /users/me
router.get('/me', userController.getProfile.bind(userController));

// PATCH /users/me
router.patch('/me', validate(updateProfileSchema), userController.updateProfile.bind(userController));

// GET /users/roles
router.get('/roles', userController.getRoles.bind(userController));

module.exports = router;
