import { GraphQLError } from 'graphql';

import TaskModel from '../models/Task.js';

import { checkAuth } from '../middlewares/checkAuth.js';
import { taskValidate } from '../validation/validation.js';

class TaskService {
    async get(params, token) {
        const id = checkAuth(token);

        const { limit, page, tabKey, sortField, sortOrder, search } = params;

        const tasksOnPage = limit > 0 ? limit : 6;
        const parsePage = page > 0 ? page : 1;
        const parseSortOrder = sortOrder === -1 ? -1 : sortOrder === 1 ? 1 : 1;

        let sortKey = {};
        switch (sortField) {
            case "createdAt": sortKey = { [sortField]: -parseSortOrder };
                break;
            case "deadline": sortKey = { [sortField]: parseSortOrder };
                break;
            case "title": sortKey = { [sortField]: parseSortOrder };
                break;
            default: sortKey = { createdAt: 1 };
        };

        let taskFilter = {};
        switch (tabKey) {
            case 0:
                taskFilter = { author: id, completed: false };
                break;
            case 1:
                taskFilter = {
                    author: id,
                    deadline: { $lt: new Date() },
                    completed: false,
                };
                break;
            case 2:
                taskFilter = { author: id, completed: true };
                break;
            default:
                taskFilter = { author: id };
        };

        if (search) taskFilter =
            { ...taskFilter, title: { $regex: search, $options: 'i' } };

        const totalTasksQty = (await TaskModel.find(taskFilter)).length;
        const totalPagesQty = Math.ceil(totalTasksQty / tasksOnPage);

        const tasks = await TaskModel.find(taskFilter, { author: false })
            .sort(sortKey)
            .limit(tasksOnPage)
            .skip((parsePage - 1) * tasksOnPage);

        const tasksOnPageQty = tasks.length;

        return { totalTasksQty, totalPagesQty, tasksOnPageQty, tasks };
    }

    async create(data, token) {
        await taskValidate(data);
        const id = checkAuth(token);
        const { title, subtitle, description, completed, deadline } = data;

        const doc = new TaskModel({
            title,
            subtitle,
            description,
            completed,
            deadline,
            author: id
        });
        const task = await doc.save();

        return task;
    }

    async update(data, token) {
        await taskValidate(data);
        const id = checkAuth(token);
        const { title, subtitle, description, _id, completed, deadline } = data;

        let completedAt = null;
        if (completed) completedAt = new Date();

        const updatedTask = await TaskModel.findOneAndUpdate(
            { _id, author: id },
            {
                $set: {
                    title,
                    subtitle,
                    description,
                    completed,
                    deadline,
                }
            },
            { returnDocument: 'after', fields: { author: false } },
        );
        if (!updatedTask) {
            throw new GraphQLError("Modified forbidden")
        };

        return updatedTask;
    }

    async delete(_id, token) {
        const id = checkAuth(token);

        const taskStatus = await TaskModel.deleteOne({ _id, author: id });
        if (!taskStatus.deletedCount) {
            throw new GraphQLError("Deleted forbidden")
        }

        return taskStatus;
    }
}

export default new TaskService;