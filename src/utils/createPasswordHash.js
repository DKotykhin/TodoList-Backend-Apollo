import bcrypt from 'bcrypt';

const SALT = 5;

export const createPasswordHash = async (password) => {
    const salt = await bcrypt.genSalt(SALT);
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash
};