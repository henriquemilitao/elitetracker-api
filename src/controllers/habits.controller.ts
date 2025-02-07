import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { habitModel } from '../models/habit.model';
import { buildValidationErrorMessage } from '../utils/build-validation-error-message.util';

// dayjs.extend(utc);

export class HabitsController {
  store = async (request: Request, response: Response) => {
    const schema = z.object({
      name: z
        .string({ message: 'Deve ser uma string' })
        .min(1, { message: 'O nome não pode estar vazio' }),
    });

    const validated = schema.safeParse(request.body);

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    const habitExists = await habitModel.findOne({
      name: validated.data.name,
      userId: request.user.id,
    });

    if (habitExists) {
      response.status(400).json({ message: 'Habit already exists' });
      return;
    }

    const data = await habitModel.create({
      name: validated.data.name,
      completedDates: [],
      userId: request.user.id,
    });

    response.status(201).json(data);
  };

  index = async (request: Request, response: Response) => {
    const habits = await habitModel
      .find({
        userId: request.user.id,
      })
      .sort({ name: 1 });

    response.status(200).json(habits);
  };

  remove = async (request: Request, response: Response) => {
    const schema = z.object({
      id: z
        .string()
        .length(24, { message: 'O ID deve ter exatamente 24 caracteres.' }),
    });

    const validated = schema.safeParse(request.params);

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    const habitExists = await habitModel.findOne({
      _id: validated.data.id,
      userId: request.user.id,
    });

    if (!habitExists) {
      response.status(404).json({ message: 'Habit not found' });
      return;
    }

    await habitModel.deleteOne({
      _id: validated.data.id,
      userId: request.user.id,
    });

    response.status(204).json();
  };

  toggle = async (request: Request, response: Response) => {
    const schema = z.object({
      id: z
        .string()
        .length(24, { message: 'O ID deve conter exatamente 24 caracteres.' })
        .regex(/^[a-f0-9]+$/, {
          message: 'O ID deve conter apenas números e letras de "a" a "f".',
        }),
    });

    const validated = schema.safeParse(request.params);

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    const habitExists = await habitModel.findOne({
      _id: validated.data.id,
      userId: request.user.id,
    });

    if (!habitExists) {
      response.status(404).json({ message: 'Habit not found' });
      return;
    }

    // const now = dayjs().utc().startOf('day').toISOString();

    const now = dayjs().startOf('day').toISOString();

    const isHabitCompletedOnDate = habitExists.completedDates.find(
      (item) => dayjs(String(item)).toISOString() === now,
    );

    // const isHabitCompletedOnDate = habitExists
    //   .toObject()
    //   ?.completedDates.find(
    //     (item) => dayjs(String(item)).toISOString() === now,
    //   );

    if (isHabitCompletedOnDate) {
      const habitUpdated = await habitModel.findOneAndUpdate(
        {
          _id: validated.data.id,
          userId: request.user.id,
        },
        {
          $pull: {
            completedDates: now,
          },
        },
        {
          returnDocument: 'after',
        },
      );
      response.status(200).json(habitUpdated);
      return;
    }

    const habitUpdated = await habitModel.findOneAndUpdate(
      {
        _id: validated.data.id,
        userId: request.user.id,
      },
      {
        $push: {
          completedDates: now,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    response.status(200).json(habitUpdated);
  };

  metrics = async (request: Request, response: Response) => {
    const schema = z.object({
      id: z
        .string()
        .length(24, { message: 'O ID deve conter exatamente 24 caracteres.' })
        .regex(/^[a-f0-9]+$/, {
          message: 'O ID deve conter apenas números e letras de "a" a "f".',
        }),
      date: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).',
        ),
      // date: z
      //   .string()
      //   .regex(
      //     /^\d{4}-\d{2}-\d{2}$/,
      //     'A data deve estar no formato yyyy-mm-dd',
      //   ),
    });

    const validated = schema.safeParse({ ...request.params, ...request.query });

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    // const dateFrom = dayjs(validated.data.date).utc().startOf('month').toDate();
    // const dateTo = dayjs(validated.data.date).utc().endOf('month').toDate();

    const dateFrom = dayjs(validated.data.date).startOf('month').toDate();
    const dateTo = dayjs(validated.data.date).endOf('month').toDate();

    const [habitMetrics] = await habitModel
      .aggregate()
      .match({
        _id: new mongoose.Types.ObjectId(validated.data.id),
        userId: request.user.id,
      })
      .project({
        _id: 1,
        name: 1,
        completedDates: {
          $filter: {
            input: '$completedDates',
            as: 'completedDate',
            cond: {
              $and: [
                {
                  $gte: ['$$completedDate', dateFrom],
                },
                {
                  $lte: ['$$completedDate', dateTo],
                },
              ],
            },
          },
        },
      });

    if (!habitMetrics) {
      response.status(404).json({ message: 'Habit not found' });
      return;
    }

    response.json(habitMetrics);
  };
}
