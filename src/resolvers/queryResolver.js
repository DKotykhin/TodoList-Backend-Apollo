import userService from '../service/userService.js';
import taskService from '../service/taskService.js';

const queryResolver = {
    Query: {

        getUserByToken: async (parent, args, contextValue) => {
            const user = await userService.loginByToken(contextValue.token);
            const { _id, email, name, createdAt, avatarURL } = user;

            return {
                _id, email, name, createdAt, avatarURL,
                message: `User ${name} successfully logged via token`,
            };
        },

        userLogin: async (parent, { email, password }) => {
            const user = await userService.login({ email, password })
            const { user: { _id, name, avatarURL, createdAt }, token } = user;

            return {
                _id, email, name, avatarURL, createdAt, token,
                message: `User ${name} successfully logged`
            };
        },

        getTasks: async (parent, { paramsInput }, contextValue) => {
            const tasksData = await taskService.get(paramsInput, contextValue.token);

            return tasksData;
        },
    },
};

export default queryResolver;
