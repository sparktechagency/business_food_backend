import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchasync";
import { IReqUser } from "../auth/auth.interface";
import { EmployerService } from "./employer.service";


const approvedAccount = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await EmployerService.approvedAccount(req.user as IReqUser, query as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});



export const EmployerController = {
    approvedAccount
};

