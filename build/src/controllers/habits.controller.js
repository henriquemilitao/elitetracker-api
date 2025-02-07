"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsController = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const habit_model_1 = require("../models/habit.model");
const build_validation_error_message_util_1 = require("../utils/build-validation-error-message.util");
// dayjs.extend(utc);
class HabitsController {
    constructor() {
        this.store = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                name: zod_1.z
                    .string({ message: 'Deve ser uma string' })
                    .min(1, { message: 'O nome não pode estar vazio' }),
            });
            const validated = schema.safeParse(request.body);
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            const habitExists = yield habit_model_1.habitModel.findOne({
                name: validated.data.name,
                userId: request.user.id,
            });
            if (habitExists) {
                response.status(400).json({ message: 'Habit already exists' });
                return;
            }
            const data = yield habit_model_1.habitModel.create({
                name: validated.data.name,
                completedDates: [],
                userId: request.user.id,
            });
            response.status(201).json(data);
        });
        this.index = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const habits = yield habit_model_1.habitModel
                .find({
                userId: request.user.id,
            })
                .sort({ name: 1 });
            response.status(200).json(habits);
        });
        this.remove = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                id: zod_1.z
                    .string()
                    .length(24, { message: 'O ID deve ter exatamente 24 caracteres.' }),
            });
            const validated = schema.safeParse(request.params);
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            const habitExists = yield habit_model_1.habitModel.findOne({
                _id: validated.data.id,
                userId: request.user.id,
            });
            if (!habitExists) {
                response.status(404).json({ message: 'Habit not found' });
                return;
            }
            yield habit_model_1.habitModel.deleteOne({
                _id: validated.data.id,
                userId: request.user.id,
            });
            response.status(204).json();
        });
        this.toggle = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                id: zod_1.z
                    .string()
                    .length(24, { message: 'O ID deve conter exatamente 24 caracteres.' })
                    .regex(/^[a-f0-9]+$/, {
                    message: 'O ID deve conter apenas números e letras de "a" a "f".',
                }),
            });
            const validated = schema.safeParse(request.params);
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            const habitExists = yield habit_model_1.habitModel.findOne({
                _id: validated.data.id,
                userId: request.user.id,
            });
            if (!habitExists) {
                response.status(404).json({ message: 'Habit not found' });
                return;
            }
            // const now = dayjs().utc().startOf('day').toISOString();
            const now = (0, dayjs_1.default)().startOf('day').toISOString();
            const isHabitCompletedOnDate = habitExists.completedDates.find((item) => (0, dayjs_1.default)(String(item)).toISOString() === now);
            // const isHabitCompletedOnDate = habitExists
            //   .toObject()
            //   ?.completedDates.find(
            //     (item) => dayjs(String(item)).toISOString() === now,
            //   );
            if (isHabitCompletedOnDate) {
                const habitUpdated = yield habit_model_1.habitModel.findOneAndUpdate({
                    _id: validated.data.id,
                    userId: request.user.id,
                }, {
                    $pull: {
                        completedDates: now,
                    },
                }, {
                    returnDocument: 'after',
                });
                response.status(200).json(habitUpdated);
                return;
            }
            const habitUpdated = yield habit_model_1.habitModel.findOneAndUpdate({
                _id: validated.data.id,
                userId: request.user.id,
            }, {
                $push: {
                    completedDates: now,
                },
            }, {
                returnDocument: 'after',
            });
            response.status(200).json(habitUpdated);
        });
        this.metrics = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                id: zod_1.z
                    .string()
                    .length(24, { message: 'O ID deve conter exatamente 24 caracteres.' })
                    .regex(/^[a-f0-9]+$/, {
                    message: 'O ID deve conter apenas números e letras de "a" a "f".',
                }),
                date: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).'),
                // date: z
                //   .string()
                //   .regex(
                //     /^\d{4}-\d{2}-\d{2}$/,
                //     'A data deve estar no formato yyyy-mm-dd',
                //   ),
            });
            const validated = schema.safeParse(Object.assign(Object.assign({}, request.params), request.query));
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            // const dateFrom = dayjs(validated.data.date).utc().startOf('month').toDate();
            // const dateTo = dayjs(validated.data.date).utc().endOf('month').toDate();
            const dateFrom = (0, dayjs_1.default)(validated.data.date).startOf('month').toDate();
            const dateTo = (0, dayjs_1.default)(validated.data.date).endOf('month').toDate();
            const [habitMetrics] = yield habit_model_1.habitModel
                .aggregate()
                .match({
                _id: new mongoose_1.default.Types.ObjectId(validated.data.id),
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
        });
    }
}
exports.HabitsController = HabitsController;
