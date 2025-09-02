import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';
import { uploadFile } from '../../middlewares/fileUploader';

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
// ===ingredient manage==================
router.get('/get-ingredient-list',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAllIngredients);
router.post('/create-ingredient',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.createIngredient);
router.patch("/ingredient/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.updateIngredient);
router.delete("/ingredient/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.deleteIngredient);
// ===Menus manage==================
router.get('/get-menus-list',
    DashboardController.getAllMenus);
router.post('/create-menu',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    uploadFile(),
    DashboardController.createMenus);
router.patch("/menu/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.updateMenus);
router.delete("/menu/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.deleteMenus);

// ===App==================
router.get('/menus-suggested',
    DashboardController.getMenusSuggested);
router.get('/menus-get-date',
    DashboardController.getMenusByDate);

export const DashboardRoutes = router;
