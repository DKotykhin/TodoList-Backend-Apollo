import { Router } from "express";

import { upload } from '../middlewares/multerUpload.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = new Router();

router.post('/upload',
    function (req, res, next) {
        const id = checkAuth(req.headers.authorization);
        req.userId = id;
        next()
    },
    upload.single('avatar'),
    function (req, res) {
        if (!req.file) {
            throw new Error("No file to upload")
        }
        res.json({
            avatarURL: `/upload/${req.file.filename}`,
            message: "Avatar successfully upload.",
        });
    },
);

export default router;