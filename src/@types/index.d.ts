import { type User } from './user.type';

export {};

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    export interface Request {
      user: User;
    }
  }
}
