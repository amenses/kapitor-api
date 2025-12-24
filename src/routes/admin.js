const express = require('express');
const { adminController } = require('../controllers');
const { verifyFirebaseToken, requireRole } = require('../middlewares');
const { validate } = require('../utils');
const { assignRoleSchema, listUsersQuerySchema } = require('../validators');

const router = express.Router();

// All routes require authentication and admin role
router.use(verifyFirebaseToken);
router.use(requireRole(['admin']));

// POST /admin/users/:uid/roles
router.post('/users/:uid/roles', validate(assignRoleSchema), adminController.assignRole.bind(adminController));

// GET /admin/users
router.get('/users', validate(listUsersQuerySchema, 'query'), adminController.listUsers.bind(adminController));

module.exports = router;
