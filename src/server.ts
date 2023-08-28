require('dotenv').config();
import app from './app';
import { envVars } from './configs/env.config';

async function init() {
  const port = envVars.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server running in port: ${port}`);
  });
}

init();
