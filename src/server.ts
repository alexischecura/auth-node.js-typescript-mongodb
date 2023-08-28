require('dotenv').config();
import app from './app';
import { envVars } from './configs/env.config';
import connectMongoDb from './utils/connectMongoDb';
import { connectRedisDB } from './utils/connectRedisDB';

async function init() {
  const port = envVars.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server running in port: ${port}`);
    connectMongoDb();
    connectRedisDB();
  });
}

init();
