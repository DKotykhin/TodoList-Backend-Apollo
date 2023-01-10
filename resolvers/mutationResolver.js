import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';

import UserModel from '../models/User.js';
import TaskModel from '../models/Task.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { userValidate } from '../validation/validation.js';
import { taskValidate } from '../validation/validation.js';

const generateToken = (_id) => {
    return jwt.sign(
        { _id },
        process.env.SECRET_KEY,
        { expiresIn: "2d" }
    )
};
const createPasswordHash = async (password) => {
    const salt = await bcrypt.genSalt(5);
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash
};

const mutationResolver = {
    Mutation: {

        userRegister: async (parent, { registerInput }) => {
            await userValidate(registerInput);
            const { email, name, password } = registerInput;
            const candidat = await UserModel.findOne({ email });
            if (candidat) {
                throw new Error(`User ${email} already exist`)
            }
            const passwordHash = await createPasswordHash(password);
            const user = await UserModel.create({
                email,
                passwordHash,
                name,
            });
            const token = generateToken(user._id);
            const { _id, createdAt } = user;

            return {
                _id, email, name, createdAt, token,
                message: `User ${name} successfully created`,
            };
        },

        userUpdateName: async (parent, { name }, contextValue) => {
            await userValidate({ name });
            const id = checkAuth(contextValue.token);
            const user = await UserModel.findById(id);
            if (!user) {
                throw new Error("Can't find user")
            }

            await userValidate({ name });

            if (name === user.name) {
                throw new Error("The same name!")
            };
            const updatedUser = await UserModel.findOneAndUpdate(
                { _id: id },
                { name },
                { returnDocument: 'after' },
            );
            const { _id, email, avatarURL, createdAt } = updatedUser;

            return {
                _id, email, name: updatedUser.name, avatarURL, createdAt,
                message: `User ${updatedUser.name} successfully updated`,
            };
        },

        userDelete: async (parent, { _id }, contextValue) => {
            const id = checkAuth(contextValue.token);
            const user = await UserModel.findById(id);
            if (!user) {
                throw new Error("Can't find user")
            }

            if (id === _id) {
                if (user.avatarURL) {
                    fs.unlink("uploads/" + user.avatarURL.split('/')[2], async (err) => {
                        if (err) {
                            throw new Error("Can't delete avatar")
                        }
                    })
                }
                const taskStatus = await TaskModel.deleteMany({ author: id });
                const userStatus = await UserModel.deleteOne({ _id: id });

                return {
                    taskStatus, userStatus,
                    message: 'User successfully deleted'
                }
            } else {
                throw new Error("Authification error")
            }
        },

        userUpdatePassword: async (parent, { password }, contextValue) => {
            const id = checkAuth(contextValue.token);
            const user = await UserModel.findById(id);
            if (!user) {
                throw new Error("Can't find user")
            }

            await userValidate({ password });
            const isValidPass = await bcrypt.compare(password, user.passwordHash);
            if (isValidPass) {
                throw new Error("The same password!")
            }
            const passwordHash = await createPasswordHash(password);
            const updatedUser = await UserModel.findOneAndUpdate(
                { _id: id },
                { passwordHash },
                { returnDocument: 'after' },
            );

            if (updatedUser) {
                return {
                    status: true,
                    message: "Password successfully updated",
                };
            } else {
                return {
                    status: false,
                    message: "Can't change password",
                };
            }
        },

        userConfirmPassword: async (parent, { password }, contextValue) => {
            const id = checkAuth(contextValue.token);
            const user = await UserModel.findById(id);
            if (!user) {
                throw new Error("Can't find user")
            }

            await userValidate({ password });

            const isValidPass = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPass) {
                return {
                    status: false,
                    message: "Wrong password!"
                }
            } else {
                return {
                    status: true,
                    message: 'Password confirmed'
                }
            }
        },

        uploadAvatar: async (parent, { avatarURL }, contextValue) => {
            const id = checkAuth(contextValue.token);
            if (!avatarURL) {
                throw new Error("No data");
            };

            await userValidate({ avatarURL });
            const user = await UserModel.findOneAndUpdate(
                { _id: id },
                { avatarURL, },
                { returnDocument: 'after' },
            );
            if (!user) {
                throw new Error("Can't find user")
            }

            return {
                avatarURL: user.avatarURL,
                message: "Avatar URL successfully upload.",
            };
        },

        deleteAvatar: async (parent, { _id }, contextValue) => {
            const id = checkAuth(contextValue.token);
            const user = await UserModel.findById(id);
            if (!user) {
                throw new Error("Can't find user")
            }
            if (id === _id) {
                if (user.avatarURL) {
                    fs.unlink("uploads/" + user.avatarURL.split('/')[2], async (err) => {
                        if (err) {
                            throw new Error("Can't delete avatar")
                        }
                    });
                    const updateUser = await UserModel.findOneAndUpdate(
                        { _id: id },
                        { avatarURL: '' },
                        { returnDocument: 'after' },
                    );

                    return {
                        avatarURL: updateUser.avatarURL,
                        message: "Avatar successfully deleted.",
                    }

                } else {
                    throw new Error("Avatar URL doesn't exist")
                }
            } else {
                throw new Error("Authification error")
            }
        },

        createTask: async (parent, { createTaskInput }, contextValue) => {
            const id = checkAuth(contextValue.token);
            await taskValidate(createTaskInput);
            const { title, subtitle, description, completed, deadline } = createTaskInput;
            const doc = new TaskModel({
                title,
                subtitle,
                description,
                completed,
                deadline,
                author: id
            });
            const task = await doc.save();
            const { _id, createdAt } = task;

            return {
                _id, title, subtitle, description, completed, createdAt, deadline,
                message: 'Task successfully created'
            };
        },

        updateTask: async (parent, { updateTaskInput }, contextValue) => {
            const id = checkAuth(contextValue.token);
            await taskValidate(updateTaskInput);

            const { title, subtitle, description, _id, completed, deadline } = updateTaskInput;
            const status = await TaskModel.updateOne(
                { _id, author: id },
                {
                    $set: {
                        title,
                        subtitle,
                        description,
                        completed,
                        deadline
                    }
                }
            );
            if (!status.modifiedCount) {
                throw new Error("Modified forbidden")
            };

            return {
                status,
                message: 'Task successfully updated'
            };
        },

        deleteTask: async (parent, { _id }, contextValue) => {
            const id = checkAuth(contextValue.token);
            const status = await TaskModel.deleteOne({ _id, author: id });
            if (!status.deletedCount) {
                throw new Error("Deleted forbidden")
            }

            return {
                status,
                message: 'Task successfully deleted'
            }
        },
    }
};

export default mutationResolver;
