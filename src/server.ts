import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { setupMongo } from './database';
import { routes } from './routes';

const app = express();
const port = process.env.PORT || 4000;

setupMongo()
  .then(() => {
    app.use(
      cors({
        origin: true,
      }),
    );

    app.use(express.json());
    app.use(routes);

    app.listen(port, () => console.log(`🚀 Server is running on port ${port}`));
  })
  .catch((err) => {
    console.log(err.message);
  });
