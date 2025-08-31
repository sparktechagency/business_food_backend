import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

// =Company Mange=====================
router.get('/get-company-list',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAllCompany);
router.post('/create-company',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.createCompany);
router.patch("/companies/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.updateCompany);
router.delete("/companies/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.deleteCompany);

export const DashboardRoutes = router;
