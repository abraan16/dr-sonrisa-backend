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

// Basic route
app.get('/', (req, res) => {
    res.send('Dr. Sonrisa AI Backend is running 🚀');
});

// Module Routes
import inputRoutes from './modules/input/input.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

app.use('/api/input', inputRoutes);
app.use('/api/analytics', analyticsRoutes);

export default app;
