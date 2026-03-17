import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app: Application = express();

// CORS — only allow your website and localhost (dev)
const allowedOrigins = [
  'https://www.kravingskitchen.in',
  'https://kravingskitchen.in',
  'http://localhost:3000',
  'http://localhost:3001',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Routes — only image upload still needs Express (Cloudinary)
import uploadRoutes from './routes/uploadRoutes';
app.use('/api/upload', uploadRoutes);

// Email routes (Nodemailer + Zoho SMTP)
import emailRoutes from './routes/emailRoutes';
app.use('/api/email', emailRoutes);

// Verify email SMTP connection on startup
import { verifyEmailConnection } from './services/emailService';
verifyEmailConnection();

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'KRAVINGS BY ARF CAFE API' });
});

// Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
