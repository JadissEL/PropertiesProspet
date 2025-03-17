const Prospect = require('../models/prospectModel');

/**
 * Get all prospects
 * @route GET /api/prospects
 * @group Prospects - Operations about prospects
 * @returns {object} 200 - An array of prospects
 * @returns {Error}  default - Unexpected error
 */
exports.getAllProspects = async (req, res) => {
    try {
        const prospects = await Prospect.find();
        res.json(prospects);
    } catch (error) {
        res.status(500).json({ message: 'Unexpected error', error });
    }
};

/**
 * Create a new prospect
 * @route POST /api/prospects
 * @group Prospects - Operations about prospects
 * @param {Prospect.model} prospect.body.required - The new prospect
 * @returns {object} 201 - The created prospect
 * @returns {Error}  default - Unexpected error
 */
exports.createProspect = async (req, res) => {
    try {
        const prospect = new Prospect(req.body);
        await prospect.save();
        res.status(201).json(prospect);
    } catch (error) {
        res.status(500).json({ message: 'Unexpected error', error });
    }
};
