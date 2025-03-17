const express = require('express');
const router = express.Router();
const { checkDatabase } = require('../checkDatabase');

router.get('/rentals', async (req, res) => {
    try {
        const properties = await checkDatabase();
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

module.exports = router;
