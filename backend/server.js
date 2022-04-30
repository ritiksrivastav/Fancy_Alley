const app = require('./app')
const connectDatabase = require('./config/database')

const dotenv = require('dotenv');
const cloudinary = require('cloudinary');

// Handle Uncaught Exception.
process.on('uncaughtException', err =>{
    console.log(`ERROR: ${err.stack}`);
    console.log(`Shutting Down Server due to uncaught exceptions`);
    process.exit(1)
})


// Setting up config file
dotenv.config({path: 'backend/config/config.env'})


// Connecting to database

connectDatabase();

// Setting up cloudinary configuration

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
})

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', err =>{
    console.log(`ERROR: ${err.message}`);
    console.log(`Shutting Down Server due to unhandled promise rejection`);
    server.close(()=>{
        process.exit(1)
    })
})