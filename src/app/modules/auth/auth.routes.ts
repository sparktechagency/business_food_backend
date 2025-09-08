import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { uploadFile } from '../../middlewares/fileUploader';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { validateRequest } from '../../middlewares/validateRequest';
import { AdminController } from '../admin/admin.controller';

const router = express.Router();

// --- Auth Routes ---
router.post("/register",
  uploadFile(),
  validateRequest(AuthValidation.createAccount),
  AuthController.registrationAccount)
router.post("/login", validateRequest(AuthValidation.loginZodSchema), AuthController.loginAccount)
router.post("/activate-user", AuthController.activateAccount)
router.post("/active-resend", AuthController.resendCodeActivationAccount)
router.post("/resend-forgot", AuthController.resendCodeForgotAccount)
router.post("/forgot-password", AuthController.forgotPass)
router.post("/verify-otp", AuthController.checkIsValidForgetActivationCode)
router.post("/reset-password", AuthController.resetPassword)
router.patch(
  "/change-password",
  auth(ENUM_USER_ROLE.COMPANY, ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.ADMIN),
  AuthController.changePassword
);

router.get(
  "/profile",
  auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY, ENUM_USER_ROLE.ADMIN),
  AuthController.getMyProfile
);

router.delete(
  "/delete-account",
  auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY, ENUM_USER_ROLE.ADMIN),
  AuthController.deleteMyAccount
);

router.patch(
  "/edit-profile",
  auth(ENUM_USER_ROLE.EMPLOYER, ENUM_USER_ROLE.COMPANY, ENUM_USER_ROLE.ADMIN),
  uploadFile(),
  AuthController.updateMyProfile
);

router.get(
  "/get-company-public",
  AuthController.getAllCompany
);
// ========== ADMIN ACCESS BLOCK ACCOUNT ========== 
router.patch(
  "/block-unblock",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(AuthValidation.blockUnblockUserZodSchema),
  AdminController.blockUnblockAuthUser
);


export const AuthRoutes = router;
