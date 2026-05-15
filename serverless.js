require('dotenv').config();
process.env.SERVERLESS = 'true';

const serverless = require('serverless-http');
const app = require('./src/app');

// Export handler for AWS Lambda, Netlify Functions, and Vercel
module.exports.handler = serverless(app);

// Vercel uses default export
module.exports.default = module.exports.handler;
