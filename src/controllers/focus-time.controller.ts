import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { z } from 'zod';

import { focusTimeModel } from '../models/focus-time.model';
import { buildValidationErrorMessage } from '../utils/build-validation-error-message.util';

export class FocusTimeController {
  store = async (request: Request, response: Response) => {
    const schema = z.object({
      timeFrom: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).',
        ),
      timeTo: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).',
        ),
    });

    const validated = schema.safeParse(request.body);

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    const timeFrom = dayjs(validated.data.timeFrom);
    const timeTo = dayjs(validated.data.timeTo);

    const isTimeToBeforeTimeTo = timeTo.isBefore(timeFrom);

    if (isTimeToBeforeTimeTo) {
      response
        .status(422)
        .json({ message: 'TimeTo cannot be before TimeFrom' });
      return;
    }

    const focusTimeCreated = await focusTimeModel.create({
      timeFrom: timeFrom.toDate(),
      timeTo: timeTo.toDate(),
      userId: request.user.id,
    });

    response.status(201).json(focusTimeCreated);
  };

  index = async (request: Request, response: Response) => {
    const schema = z.object({
      date: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).',
        ),
    });

    const validated = schema.safeParse(request.query);

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    const startDate = dayjs(validated.data.date).startOf('day');
    const endDate = dayjs(validated.data.date).endOf('day');

    const focusTimeOfDay = await focusTimeModel
      .find({
        timeFrom: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
        userId: request.user.id,
      })
      .sort({
        timeFrom: 1,
      });

    response.status(200).json(focusTimeOfDay);
  };

  metricsByMonth = async (request: Request, response: Response) => {
    const schema = z.object({
      date: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).',
        ),
    });

    const validated = schema.safeParse(request.query);

    if (!validated.success) {
      const errors = buildValidationErrorMessage(validated.error.issues);

      response.status(422).json({ message: errors });
      return;
    }

    const startDate = dayjs(validated.data.date).startOf('month');
    const endDate = dayjs(validated.data.date).endOf('month');

    const focusTimesMetrics = await focusTimeModel
      .aggregate()
      .match({
        timeFrom: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
        userId: request.user.id,
      })
      .project({
        year: {
          $year: '$timeFrom',
        },
        month: {
          $month: '$timeFrom',
        },
        day: {
          $dayOfMonth: '$timeFrom',
        },
      })
      .group({
        _id: ['$year', '$month', '$day'],
        count: {
          $sum: 1,
        },
      })
      .sort({
        _id: 1,
      });

    response.status(200).json(focusTimesMetrics);
  };
}
