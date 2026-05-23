const express = require('express');
const sessionController = require('../controllers/session.controller');
const auth = require('../middlewares/auth.middleware');
const router = express.Router();

router.use(auth()); // All routes require authentication

router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSessionById);
router.post('/:id/join', sessionController.joinSession);
router.put('/:id/swap-roles', sessionController.swapRoles);
router.put('/:id/complete', sessionController.completeSession);

module.exports = router;