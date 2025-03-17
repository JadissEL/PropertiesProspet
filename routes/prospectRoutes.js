const express = require('express');
const prospectController = require('../controllers/prospectController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Route to get all prospects
router.get('/', authenticateToken, prospectController.getAllProspects);

// Route to create a new prospect
router.post('/', authenticateToken, prospectController.createProspect);

// Add other routes as needed
// Example:
// router.put('/:id', authenticateToken, prospectController.updateProspect);
// router.delete('/:id', authenticateToken, prospectController.deleteProspect);

module.exports = router;
