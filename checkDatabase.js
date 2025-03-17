require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/properties';

const client = new MongoClient(uri);

async function checkDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db('properties');
        const properties = database.collection('rentals');

        const results = await properties.find({
            propertyType: 'rental',
            status: 'available'
        }).toArray();

        console.log('Rental Properties:', results);

    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

checkDatabase().catch(console.error);
