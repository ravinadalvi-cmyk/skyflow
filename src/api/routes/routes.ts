import { Router } from 'express';
import { deidentifyController } from '../controllers/deidentifyController';
import { validateDeidentifyRequest } from '../middlewares/validateDeidentifyRequest';

const router = Router();

router.post('/deidentify', validateDeidentifyRequest, deidentifyController);

export default router;
