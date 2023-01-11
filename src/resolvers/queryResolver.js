import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';

import UserModel from '../models/User.js';
import TaskModel from '../models/Task.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { findUser } from '../utils/findUser.js';
import { generateToken } from '../utils/generateToken.js'
import { userValidate } from '../validation/validation.js';

const queryResolver = {
    Query: {

        getUserByToken: async (parent, args, contextValue) => {
            const id = checkAuth(contextValue.token);
            const user = await findUser(id);
            const { _id, email, name, createdAt, avatarURL } = user;
            return {
                _id, email, name, createdAt, avatarURL,
                message: `User ${name} successfully logged via token`,
            };
        },

        userLogin: async (parent, { email, password }) => {
            await userValidate({ email, password });
            const user = await UserModel.findOne({ email });
            if (!user) {
                throw new GraphQLError("Can't find user")
            }
            const isValidPass = await bcrypt.compare(password, user.passwordHash)
            if (!isValidPass) {
                throw new GraphQLError('Incorrect login or password')
            }
            const token = generateToken(user._id);
            const { _id, name, avatarURL, createdAt } = user;

            return {
                _id, email, name, avatarURL, createdAt, token,
                message: `User ${name} successfully logged`
            };
        },

        getTasks: async (parent, { paramsInput }, contextValue) => {
            const id = checkAuth(contextValue.token);
            const params = paramsInput ? paramsInput : {};
            const { limit, page, tabKey, sortField, sortOrder, search } = params;
            const tasksOnPage = limit > 0 ? limit : 6;
            const pageNumber = page > 0 ? page : 1;
            const tabKeyNumber = tabKey >= 0 ? tabKey : 0;
            const sortFieldString = sortField ? sortField : "createdAt";
            const sortOrderNumber = sortOrder ? sortOrder : -1;

            let taskFilter = { author: id };
            if (tabKeyNumber === 1) taskFilter = { ...taskFilter, completed: false };
            if (tabKeyNumber === 2) taskFilter = { ...taskFilter, completed: true };
            if (search) taskFilter =
                { ...taskFilter, title: { $regex: search, $options: 'i' } };

            let sortKey;
            switch (sortFieldString) {
                case 'createdAt': sortKey = { createdAt: sortOrderNumber }
                    break;
                case 'deadline': sortKey = { deadline: sortOrderNumber }
                    break;
                case 'title': sortKey = { title: sortOrderNumber }
                    break;
                default: sortKey = { createdAt: -1 }
            };

            const totalTasksQty = (await TaskModel.find(taskFilter)).length;
            const totalPagesQty = Math.ceil(totalTasksQty / tasksOnPage);

            const tasks = await TaskModel.find(taskFilter, {
                _id: true,
                title: true,
                subtitle: true,
                description: true,
                completed: true,
                createdAt: true,
                deadline: true
            }).sort(sortKey).limit(tasksOnPage).skip((pageNumber - 1) * tasksOnPage);

            const tasksOnPageQty = tasks.length;

            return {
                totalTasksQty, totalPagesQty, tasksOnPageQty, tasks
            };
        },
    },
};

export default queryResolver;
