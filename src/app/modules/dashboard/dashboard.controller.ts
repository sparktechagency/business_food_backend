import catchAsync from "../../../shared/catchasync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from 'express';
import { DashboardService } from "./dashboard.service";
import { IReqUser } from "../auth/auth.interface";

const getAllCompany = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getAllCompany(req.query as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});

const createCompany = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.createCompany(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});

const deleteCompany = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DashboardService.deleteCompany(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Company deleted successfully",
        data: result,
    });
});

const updateCompany = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DashboardService.updateCompany(id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Company updated successfully",
        data: result,
    });
});
// ===================== 
const getAllIngredients = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getAllIngredients(req.query as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ingredients retrieved successfully",
        data: result,
    });
});

const createIngredient = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.createIngredient(req as Request);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Ingredient created successfully",
        data: result,
    });
});

const deleteIngredient = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DashboardService.deleteIngredient(req);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ingredient deleted successfully",
        data: result,
    });
});

const updateIngredient = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.updateIngredient(req as Request);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ingredient updated successfully",
        data: result,
    });
});

// ===================== 
const getAllMenus = catchAsync(async (req: Request, res: Response) => {
    const { authId } = req.user as IReqUser;
    const result = await DashboardService.getAllMenus(req.query as any, authId as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Menus retrieved successfully",
        data: result,
    });
});

const createMenus = catchAsync(async (req: Request, res: Response) => {
    const files = req.files;
    const result = await DashboardService.createMenus(files, req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Menus created successfully",
        data: result,
    });
});

const deleteMenus = catchAsync(async (req: Request, res: Response) => {

    const result = await DashboardService.deleteMenu(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Menus deleted successfully",
        data: result,
    });
});

const updateMenus = catchAsync(async (req: Request, res: Response) => {
    const files = req.files;
    const result = await DashboardService.updateMenu(files as any, req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Menus updated successfully",
        data: result,
    });
});

const getMenusSuggested = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getMenusSuggested();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "successfully",
        data: result,
    });
});

const getMenusByDate = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const user = req.user;
    const result = await DashboardService.getMenusByDate(query as any, user as IReqUser);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "successfully",
        data: result,
    });
});

const getMenuDetails = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { authId } = req.user as IReqUser;
    const result = await DashboardService.getMenuDetails(id as any, authId as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "successfully",
        data: result,
    });
});

const getEmployerProfile = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const user = req.user;
    const result = await DashboardService.getEmployerProfile(user as IReqUser, query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "successfully",
        data: result,
    });
});

const createScheduleOrder = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    const result = await DashboardService.createScheduleOrder(user as IReqUser, payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order created successfully",
        data: result,
    });
});

const getUserOrders = catchAsync(async (req: Request, res: Response) => {
    const payload = req.query;
    const user = req.user;
    const result = await DashboardService.getUserOrders(user as IReqUser, payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order history get successfully;",
        data: result,
    });
});

const getUserInvoice = catchAsync(async (req: Request, res: Response) => {
    const payload = req.query;
    const user = req.user;
    const result = await DashboardService.getUserInvoice(user as IReqUser, payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order invoice get successfully;",
        data: result,
    });
});

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const { authId } = req.user as IReqUser;
    const menuId = req.params.id;
    const result = await DashboardService.addRemoveFavorites(authId as string, menuId as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.message,
        data: result,
    });
});

const getUserFavorites = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IReqUser;
    const result = await DashboardService.getUserFavorites(user);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const sendReviews = catchAsync(async (req: Request, res: Response) => {
    // const user = req.user as IReqUser;
    const payload = req.body;
    const result = await DashboardService.sendReviews(payload as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});


const deleteEmployerProfiles = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.user as IReqUser;
    const profileId = req.params.id;
    const result = await DashboardService.deleteEmployerProfiles(userId as string, profileId as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Employer profile deleted successfully',
        data: result,
    });
});


const getAllOderAdmin = catchAsync(async (req: Request, res: Response) => {
    const payload = req.query;
    const result = await DashboardService.getAllOderAdmin(payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

// ====================
const addTermsConditions = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.addTermsConditions(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const getTermsConditions = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getTermsConditions();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const addPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.addPrivacyPolicy(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getPrivacyPolicy();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const addAboutUs = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.addAboutUs(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const getAboutUs = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getAboutUs();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Successful',
        data: result,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await DashboardService.updateOrderStatus(query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Status update successfully!',
        data: result,
    });
});


const getAllCompanyPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await DashboardService.getAllCompanyPayment(query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Get All Company Payments successfully!',
        data: result,
    });
});


const updateCompanyPaymentMonthly = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await DashboardService.updateCompanyPaymentMonthly(query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Updates Company Payments successfully!',
        data: result,
    });
});

const getCompanyDetails = catchAsync(async (req: Request, res: Response) => {
    const company_id = req.params.company_id as string;
    const result = await DashboardService.getCompanyDetails(company_id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Updates Company Payments successfully!',
        data: result,
    });
});

export const DashboardController = {
    getCompanyDetails,
    getAllCompanyPayment,
    updateOrderStatus,
    addTermsConditions,
    getTermsConditions,
    addPrivacyPolicy,
    getPrivacyPolicy,
    addAboutUs,
    getAboutUs,
    getAllOderAdmin,
    deleteEmployerProfiles,
    sendReviews,
    getUserFavorites,
    getAllCompany,
    createCompany,
    deleteCompany,
    toggleFavorite,
    updateCompany,
    updateIngredient,
    createIngredient,
    deleteIngredient,
    getAllIngredients,
    updateMenus,
    deleteMenus,
    createMenus,
    getAllMenus,
    getMenusSuggested,
    getMenusByDate,
    getMenuDetails,
    getEmployerProfile,
    createScheduleOrder,
    getUserOrders,
    getUserInvoice,
    updateCompanyPaymentMonthly
};
