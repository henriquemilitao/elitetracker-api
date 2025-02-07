import { Router } from 'express';

import packageJson from '../package.json';
import { AuthController } from './controllers/auth.controller';
import { FocusTimeController } from './controllers/focus-time.controller';
import { HabitsController } from './controllers/habits.controller';
import { authMiddleware } from './middlewares/auth.middleware';

const habitsController = new HabitsController();
const focusTimeController = new FocusTimeController();
const authController = new AuthController();

export const routes = Router();

routes.get('/', (req, res) => {
  const { name, version, description } = packageJson;

  res.status(200).json({ name, version, description });
});

routes.get('/auth', authController.auth);
routes.get('/auth/callback', authController.authCallback);

routes.use(authMiddleware);

routes.get('/habits', habitsController.index);

routes.post('/habits', habitsController.store);

routes.delete('/habits/:id', habitsController.remove);

routes.patch('/habits/:id/toggle', habitsController.toggle);

routes.get('/habits/:id/metrics', habitsController.metrics);

routes.post('/focus-time', focusTimeController.store);

routes.get('/focus-time', focusTimeController.index);

routes.get('/focus-time/metrics', focusTimeController.metricsByMonth);
