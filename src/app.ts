import express from 'express';

import { NotFoundError } from './utils/AppError';
import globalErrorHandler from './controllers/error.controller';

const app = express();

app.use(express.json({ limit: '10kb' }));

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
