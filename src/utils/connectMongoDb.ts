import mongoose from 'mongoose';
import { envVars } from '../configs/env.config';

const mongoURL = envVars.MONGO_URL.replace(
  '<PASSWORD>',
  envVars.MONGO_PASSWORD
);

const connectMongoDb = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log('Mongo Database succesfully conected');
  } catch (error) {
    console.error(`Error in the connection to Mongo DB: ${error}`);
    console.log('Trying again in 3 seconds');
    setTimeout(connectMongoDb, 3000);
  }
};

export default connectMongoDb;
