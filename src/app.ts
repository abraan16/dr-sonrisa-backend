import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
    res.send('Dr. Sonrisa AI Backend is running 🚀');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module Routes
import inputRoutes from './modules/input/input.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

app.use('/api/input', inputRoutes);
app.use('/api/analytics', analyticsRoutes);

export default app;
