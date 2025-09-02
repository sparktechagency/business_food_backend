import catchAsync from "../../../shared/catchasync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from 'express';
import { DashboardService } from "./dashboard.service";

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
    const result = await DashboardService.getAllMenus(req.query as any);
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
    const result = await DashboardService.updateMenu(req.params.id, req.body);
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
    const result = await DashboardService.getMenusByDate(query as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "successfully",
        data: result,
    });
});

export const DashboardController = {
    getAllCompany,
    createCompany,
    deleteCompany,
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
    getMenusByDate
};
