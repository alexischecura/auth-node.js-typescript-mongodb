import express from 'express';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/api/v1/test', (_, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the auth API',
  });
});

export default app;
