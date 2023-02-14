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
            throw new GraphQLError(`User ${email} already exist`)
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
            throw new GraphQLError("Can't find user")
        }
        const isValidPass = await bcrypt.compare(password, user.passwordHash)
        if (!isValidPass) {
            throw new GraphQLError('Incorrect login or password')
        }
        const token = generateToken(user._id);

        return { user, token }
    }

    async updateName(name, token) {
        await userValidate({ name });
        const _id = checkAuth(token);
        const user = await findUser(_id);

        if (name === user.name) {
            throw new GraphQLError("The same name!")
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
            return {
                status: false,
                message: "Wrong password!"
            }
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
            throw new GraphQLError("The same password!")
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
                        throw new GraphQLError("Can't delete avatar")
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
        const totalTasks = TaskModel.countDocuments(
            { author: _id }
        );
        const completedTasks = TaskModel.countDocuments(
            {
                author: _id,
                completed: true
            }
        );
        const nowDate = new Date().toISOString();
        const overdueTasks = TaskModel.countDocuments(
            {
                author: _id,
                deadline: { $lt: nowDate },
                completed: false
            }
        );
        const values = Promise.all([totalTasks, completedTasks, overdueTasks]).then(values => {
            const activeTasks = values[0] - values[1];
            return {
                totalTasks: values[0],
                completedTasks: values[1],
                activeTasks,
                overdueTasks: values[2]
            }
        });

        return values;
    }
}

export default new UserService;