import express from 'express';
import {createTimer} from '../controllers/timerController.js';

const router = express.Router();


router.post('/timers', createTimer);


export default router;