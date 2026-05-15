const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chat Application API',
      version: '1.0.0',
      description:
        'REST API for a real-time chat application built with Express.js, MySQL (Prisma), and Socket.io.\n\n' +
        '**Socket.io events reference:** [`/api/socket-docs`](/api/socket-docs)',
    },
    servers: [
      {
        url: `http://${process.env.SERVER_IP || 'localhost'}:${process.env.PORT || 5000}`,
        description: 'Network (share with team)',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token (obtained from /api/auth/login)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1abc123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            avatar: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
            isOnline: { type: 'boolean', example: true },
            lastSeen: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful' },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Chat: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx2chat456' },
            isGroupChat: { type: 'boolean', example: false },
            groupName: { type: 'string', nullable: true, example: 'Team Alpha' },
            groupAvatar: { type: 'string', example: '' },
            groupAdmin: { $ref: '#/components/schemas/User' },
            members: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            latestMessage: { $ref: '#/components/schemas/Message' },
            unreadCount: {
              type: 'integer',
              example: 3,
              description: 'Number of unread messages in this chat for the logged-in user',
            },
            chatWith: {
              allOf: [{ $ref: '#/components/schemas/User' }],
              nullable: true,
              description: 'For 1-1 chats: the other participant. Null for group chats.',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx3msg789' },
            chatId: { type: 'string', example: 'clx2chat456' },
            sender: { $ref: '#/components/schemas/User' },
            content: { type: 'string', example: 'Hello!' },
            type: { type: 'string', enum: ['TEXT', 'IMAGE', 'FILE'], example: 'TEXT' },
            fileUrl: { type: 'string', example: '' },
            fileName: { type: 'string', example: '' },
            readBy: {
              type: 'array',
              items: {
                type: 'object',
                properties: { userId: { type: 'string' } },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'An error occurred' },
          },
        },
        Upload: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: 'clx9up1234' },
            url:       { type: 'string', example: 'https://res.cloudinary.com/diuwgxbe4/image/upload/v1/chat-app/uploads/sample.jpg' },
            publicId:  { type: 'string', example: 'chat-app/uploads/sample' },
            format:    { type: 'string', example: 'jpg' },
            bytes:     { type: 'integer', example: 204800 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request — missing or invalid fields',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized — missing or invalid access token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden — insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Conflict: {
          description: 'Conflict — resource already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
