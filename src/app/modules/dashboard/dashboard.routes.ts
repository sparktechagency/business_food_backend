import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';
import { uploadFile } from '../../middlewares/fileUploader';
import { EmployerController } from '../employer/employer.controller';
const router = express.Router();

// =Company Mange=====================
router.get('/get-total-count',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getDashboardHomeTotalCount);
router.get('/get-earning-overview',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getDashboardEarningOverview);
router.get('/get-user-overview',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getDashboardUserOverview);

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
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAllMenus);
router.post('/create-menu',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    uploadFile(),
    DashboardController.createMenus);
router.patch("/menu/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    uploadFile(),
    DashboardController.updateMenus);
router.delete("/menu/:id",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.deleteMenus);

// ===App==================
router.get('/menus-suggested',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.getMenusSuggested);
router.get('/menus-get-date',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.getMenusByDate);
router.get('/menu-details/:id',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getMenuDetails);
router.patch('/toggle_favorite/:id',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.toggleFavorite);
router.get('/get_user_favorites',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.getUserFavorites);

// =========
router.post('/create-order',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.createScheduleOrder);
router.get('/get-all-order',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.getUserOrders);
router.get('/get-order-invoice',
    auth(ENUM_USER_ROLE.COMPANY),
    DashboardController.getUserInvoice);
router.post('/send_reviews',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.sendReviews
);

// =========
router.get('/employer-profile',
    auth(ENUM_USER_ROLE.COMPANY),
    DashboardController.getEmployerProfile);
router.delete('/delete_employer_profile/:id',
    auth(ENUM_USER_ROLE.COMPANY),
    DashboardController.deleteEmployerProfiles);
router.patch('/approved_employer',
    auth(ENUM_USER_ROLE.COMPANY),
    EmployerController.approvedAccount);

// =ADMIN========= 
router.get('/get-all-orders',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAllOderAdmin);
router.patch('/update-order-status',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.updateOrderStatus);

// =======================================
router.post('/addupdate-termsConditions',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.addTermsConditions,
);
router.get('/get-rules',
    DashboardController.getTermsConditions,
);
router.post('/addupdate-privacy-policy',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.addPrivacyPolicy,
);
router.get('/get-privacy-policy',
    DashboardController.getPrivacyPolicy,
);
router.post('/addupdate-about-us',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.addAboutUs,
);
router.get('/get-about-us',
    DashboardController.getAboutUs,
);

// ==========================
router.get('/get_all_company_payment',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAllCompanyPayment,
);
router.patch('/update_company_payment_monthly',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.updateCompanyPaymentMonthly,
);
router.get('/get_company_details/:company_id',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getCompanyDetails,
);
router.get('/get_company_order/:company_id',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getCompanyEmployerOrder,
);

// ===========================
router.get('/admin-employer-profile',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAdminEmployerProfile);
// ===============================
router.get('/get-notifications',
    auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY),
    DashboardController.getUserNotifications);



export const DashboardRoutes = router;
