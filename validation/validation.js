import * as yup from 'yup';
import { GraphQLError } from 'graphql';

const userSchema = yup.object().shape({
    name: yup.string().min(3).max(100),
    email: yup.string().email().max(100),
    password: yup.string().min(8).max(100),
    avatarURL: yup.string().max(255)
});

const taskSchema = yup.object().shape({
    title: yup.string().min(3).max(100).required(),
    subtitle: yup.string().max(100),
    description: yup.string().max(1000),
    completed: yup.boolean(),
    deadline: yup.date()
});

export const userValidate = async (validateData) => {
    try {
        await userSchema.validate(validateData)
    } catch (err) {
        throw new GraphQLError(err.message)
    };
};

export const taskValidate = async (validateData) => {
    try {
        await taskSchema.validate(validateData)
    } catch (err) {
        throw new GraphQLError(err.message)
    };
}