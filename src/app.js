const express = require('express');
const { COMMON } = require('./constants/messages');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const errorMiddleware = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const socketDocsRoute = require('./routes/socketDocsRoute');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// CORS — allow localhost, local network frontend, and the server's own origin (Swagger UI)
const SERVER_PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CLIENT_URL,
  `http://${process.env.SERVER_IP}:3000`,
  `http://${process.env.SERVER_IP}:${SERVER_PORT}`,
  `http://localhost:${SERVER_PORT}`,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / mobile / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// REST routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.io events docs
app.use('/api/socket-docs', socketDocsRoute);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Chat App API' }));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/health', (req, res) =>
  res.status(200).json({
    status: 'ok',
    mode: process.env.SERVERLESS ? 'serverless' : 'server',
  })
);

// 404
app.use((req, res) => res.status(404).json({ message: COMMON.ROUTE_NOT_FOUND }));

// Global error handler
app.use(errorMiddleware);

module.exports = app;
