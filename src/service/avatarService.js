import fs from 'fs';
import { GraphQLError } from 'graphql';

import UserModel from '../models/User.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { findUser } from '../utils/findUser.js';
import { userValidate } from '../validation/validation.js';

class AvatarService {
    async uploadUrl(avatarURL, token) {
        await userValidate({ avatarURL });
        const id = checkAuth(token);        
        if (!avatarURL) {
            throw new GraphQLError("No data");
        };

        const user = await UserModel.findOneAndUpdate(
            { _id: id },
            { avatarURL, },
            { returnDocument: 'after' },
        );
        if (!user) {
            throw new GraphQLError("Can't update avatar URL")
        }

        return user;
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
                });
                const updatedUser = await UserModel.findOneAndUpdate(
                    { _id: id },
                    { avatarURL: '' },
                    { returnDocument: 'after' },
                );

                if (!updatedUser) {
                    throw new GraphQLError("Can't update avatar URL")
                }

                return updatedUser;
            } else {
                throw new GraphQLError("Avatar URL doesn't exist")
            }
        } else {
            throw new GraphQLError("Authification error")
        }
    }
}

export default new AvatarService;