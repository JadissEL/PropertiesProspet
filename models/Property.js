const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    propertyType: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    status: { type: String, default: 'available' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);
