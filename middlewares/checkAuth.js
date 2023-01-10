import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

export const checkAuth = (auth) => {

    if (!auth) {
        throw new GraphQLError("No autorization data");
    }
    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        return decoded._id;
    } catch {
        throw new GraphQLError("Autorization error");
    }
}

