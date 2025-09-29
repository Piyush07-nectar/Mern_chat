const mongoose = require('mongoose')

const connectDB = async () => {
    console.log('=== MongoDB Connection Debug ===');
    console.log('MONGO_URI value:', process.env.MONGO_URI);
    console.log('MONGO_URI type:', typeof process.env.MONGO_URI);
    console.log('MONGO_URI truthy:', !!process.env.MONGO_URI);
    
    // Skip MongoDB connection if no URI is provided
    if (!process.env.MONGO_URI) {
        console.log('📝 MongoDB connection skipped - using static data')
        console.log('===============================================')
        return null
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
        return conn
    } catch (error) {
        console.log(`⚠️ MongoDB connection failed: ${error.message}`)
        console.log('📝 Continuing with static data...')
        return null
    }
}

module.exports = connectDB