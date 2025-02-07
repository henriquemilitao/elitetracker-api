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
exports.FocusTimeController = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const zod_1 = require("zod");
const focus_time_model_1 = require("../models/focus-time.model");
const build_validation_error_message_util_1 = require("../utils/build-validation-error-message.util");
class FocusTimeController {
    constructor() {
        this.store = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                timeFrom: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).'),
                timeTo: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).'),
            });
            const validated = schema.safeParse(request.body);
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            const timeFrom = (0, dayjs_1.default)(validated.data.timeFrom);
            const timeTo = (0, dayjs_1.default)(validated.data.timeTo);
            const isTimeToBeforeTimeTo = timeTo.isBefore(timeFrom);
            if (isTimeToBeforeTimeTo) {
                response
                    .status(422)
                    .json({ message: 'TimeTo cannot be before TimeFrom' });
                return;
            }
            const focusTimeCreated = yield focus_time_model_1.focusTimeModel.create({
                timeFrom: timeFrom.toDate(),
                timeTo: timeTo.toDate(),
                userId: request.user.id,
            });
            response.status(201).json(focusTimeCreated);
        });
        this.index = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                date: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).'),
            });
            const validated = schema.safeParse(request.query);
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            const startDate = (0, dayjs_1.default)(validated.data.date).startOf('day');
            const endDate = (0, dayjs_1.default)(validated.data.date).endOf('day');
            const focusTimeOfDay = yield focus_time_model_1.focusTimeModel
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
        });
        this.metricsByMonth = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const schema = zod_1.z.object({
                date: zod_1.z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'O valor deve estar no formato ISO 8601 completo (ex: 2024-12-10T04:00:00.000Z).'),
            });
            const validated = schema.safeParse(request.query);
            if (!validated.success) {
                const errors = (0, build_validation_error_message_util_1.buildValidationErrorMessage)(validated.error.issues);
                response.status(422).json({ message: errors });
                return;
            }
            const startDate = (0, dayjs_1.default)(validated.data.date).startOf('month');
            const endDate = (0, dayjs_1.default)(validated.data.date).endOf('month');
            const focusTimesMetrics = yield focus_time_model_1.focusTimeModel
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
        });
    }
}
exports.FocusTimeController = FocusTimeController;
