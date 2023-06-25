import userService from '../service/userService.js';
import avatarService from '../service/avatarService.js';
import taskService from '../service/taskService.js';

const mutationResolver = {
    Mutation: {

        userRegister: async (parent, { registerInput }) => {
            const user = await userService.register(registerInput);
            const { user: { _id, email, name, createdAt }, token } = user;

            return {
                _id, email, name, createdAt, token,
                message: `User ${name} successfully created`,
            };
        },

        userUpdateName: async (parent, { name }, contextValue) => {
            const updatedUser = await userService.updateName(name, contextValue.token);
            const { _id, email, avatarURL, createdAt } = updatedUser;

            return {
                _id, email, name, avatarURL, createdAt,
                message: `User ${name} successfully updated`,
            };
        },

        userConfirmPassword: async (parent, { password }, contextValue) => {
            const status = await userService.confirmPassword(password, contextValue.token);

            return status;
        },

        userUpdatePassword: async (parent, { password }, contextValue) => {
            const updatedUser = await userService.updatePassword(password, contextValue.token);

            if (updatedUser) {
                return {
                    status: true,
                    message: "Password successfully updated",
                };
            }
        },

        userResetPassword: async (parent, { email }) => {
            const status = await userService.resetPassword(email);

            return {
                status: status.response,
                message: `Email successfully sent to ${status.accepted}`,
            };
        },

        userSetNewPassword: async (parent, { setPasswordInput }) => {
            const updatedUser = await userService.setNewPassword(setPasswordInput);

            if (updatedUser) {
                return {
                    status: true,
                    message: `${updatedUser.name} password successfully updated`,
                };
            }
        },

        userDelete: async (parent, { _id }, contextValue) => {
            const status = await userService.delete(_id, contextValue.token);

            return {
                ...status,
                message: 'User successfully deleted'
            };
        },

        uploadAvatar: async (parent, { avatarURL }, contextValue) => {
            const user = await avatarService.uploadUrl(avatarURL, contextValue.token);

            return {
                avatarURL: user.avatarURL,
                message: "Avatar URL successfully upload.",
            };
        },

        deleteAvatar: async (parent, { _id }, contextValue) => {
            const updatedUser = await avatarService.delete(_id, contextValue.token);
            const { avatarURL } = updatedUser;

            return {
                avatarURL,
                message: "Avatar successfully deleted.",
            }
        },

        createTask: async (parent, { createTaskInput }, contextValue) => {
            const newTask = await taskService.create(createTaskInput, contextValue.token);

            return {
                ...newTask._doc,
                message: 'Task successfully created'
            };
        },

        updateTask: async (parent, { updateTaskInput }, contextValue) => {
            const updatedTask = await taskService.update(updateTaskInput, contextValue.token);

            return {
                ...updatedTask._doc,
                message: 'Task successfully updated'
            };
        },

        deleteTask: async (parent, { _id }, contextValue) => {
            const status = await taskService.delete(_id, contextValue.token)

            return {
                status,
                message: 'Task successfully deleted'
            }
        },
    }
};

export default mutationResolver;
