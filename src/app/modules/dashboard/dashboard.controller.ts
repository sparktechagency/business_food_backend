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



export const DashboardController = {
    getAllCompany,
    createCompany,
    deleteCompany,
    updateCompany
};
