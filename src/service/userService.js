import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';

import UserModel from '../models/User.js';
import TaskModel from '../models/Task.js';

import { checkAuth } from '../middlewares/checkAuth.js';
import { userValidate } from '../validation/validation.js';

import { findUser } from '../utils/findUser.js';
import { generateToken } from '../utils/generateToken.js'
import { createPasswordHash } from '../utils/createPasswordHash.js'

class UserService {

    async loginByToken(token) {
        const id = checkAuth(token);
        const user = await findUser(id);

        return user;
    }

    async register(data) {
        await userValidate(data);
        const { email, name, password } = data;
        const candidat = await UserModel.findOne({ email });
        if (candidat) {
            throw new GraphQLError(`User ${email} already exist`, { extensions: { code: 'BAD_USER_INPUT' } })
        }
        const passwordHash = await createPasswordHash(password);
        const user = await UserModel.create({
            email,
            passwordHash,
            name,
        });
        const token = generateToken(user._id);

        return { user, token };
    }

    async login(data) {
        await userValidate(data);
        const { email, password } = data;
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new GraphQLError("Can't find user", { extensions: { code: 'BAD_USER_INPUT' } })
        }
        const isValidPass = await bcrypt.compare(password, user.passwordHash)
        if (!isValidPass) {
            throw new GraphQLError('Incorrect login or password', { extensions: { code: 'BAD_USER_INPUT' } })
        }
        const token = generateToken(user._id);

        return { user, token }
    }

    async updateName(name, token) {
        await userValidate({ name });
        const _id = checkAuth(token);
        const user = await findUser(_id);

        if (name === user.name) {
            throw new GraphQLError("The same name!", { extensions: { code: 'BAD_USER_INPUT' } })
        };

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id },
            { name },
            { returnDocument: 'after' },
        );

        return updatedUser;
    }

    async confirmPassword(password, token) {
        await userValidate({ password });
        const _id = checkAuth(token);
        const user = await findUser(_id);

        const isValidPass = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPass) {
            throw new GraphQLError("Wrong password!", { extensions: { code: 'BAD_USER_INPUT' } })
        } else return {
            status: true,
            message: 'Password confirmed'
        }
    }

    async updatePassword(password, token) {
        await userValidate({ password });

        const _id = checkAuth(token);
        const user = await findUser(_id);

        const isValidPass = await bcrypt.compare(password, user.passwordHash);
        if (isValidPass) {
            throw new GraphQLError("The same password!", { extensions: { code: 'BAD_USER_INPUT' } })
        }
        const passwordHash = await createPasswordHash(password);
        const updatedUser = await UserModel.findOneAndUpdate(
            { _id },
            { passwordHash },
            { returnDocument: 'after' },
        );
        if (!updatedUser) {
            throw new GraphQLError("Can't change password")
        }
        return updatedUser;
    }

    async delete(_id, token) {
        const id = checkAuth(token);

        const user = await findUser(id);

        if (id === _id) {
            if (user.avatarURL) {
                fs.unlink("uploads/" + user.avatarURL.split('/')[2], async (err) => {
                    if (err) {
                        throw new GraphQLError("Can't delete avatar", { extensions: { code: 'FORBIDDEN' } })
                    }
                })
            }
            const taskStatus = await TaskModel.deleteMany({ author: id });
            const userStatus = await UserModel.deleteOne({ _id: id });

            return { taskStatus, userStatus };
        } else {
            throw new GraphQLError("Authification error")
        }
    }

    async statistic(token) {
        const _id = checkAuth(token);
        const tasks = await this.TaskModel
            .aggregate()
            .match({ author: new Types.ObjectId(_id) })
            .group({
                _id: '$completed',
                count: {
                    $sum: 1,
                },
                overdue: {
                    $sum: { $cond: [{ $lt: ['$deadline', new Date()] }, 1, 0] },
                },
            });

        const activeTasks = tasks?.find((res) => res._id === false).count || 0;
        const overdueTasks = tasks?.find((res) => res._id === false).overdue || 0;
        const completedTasks = tasks?.find((res) => res._id === true).count || 0;

        return {
            totalTasks: activeTasks + completedTasks,
            completedTasks,
            activeTasks,
            overdueTasks,
        };
    }
}

export default new UserService;