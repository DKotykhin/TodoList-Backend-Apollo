import { Router } from "express";

import { upload } from '../utils/multerConfig.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import resizeImages from "../middlewares/resizeImages.js";

const router = new Router();

router.post('/upload',
    function (req, res, next) {
        const id = checkAuth(req.headers.authorization);
        req.userId = id;
        next()
    },
    upload.single('avatar'),
    resizeImages,
    function (req, res) {
                
        res.json({
            avatarURL: `/upload/${req.file.filename}`,
            message: "Avatar successfully upload.",
        });
    },
);

export default router;