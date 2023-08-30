import express from 'express';
import cookieParser from 'cookie-parser';

import { NotFoundError } from './utils/AppError';
import globalErrorHandler from './controllers/error.controller';
import usersRoute from './routes/user.routes';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Routes

app.use('/api/v1/users', usersRoute);

app.get('/api/v1/test', (_, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the auth API',
  });
});

app.all('*', (req, _, next) => {
  next(new NotFoundError(`Resource in ${req.originalUrl} not found`));
});

// Global errors handler
app.use(globalErrorHandler);

export default app;
