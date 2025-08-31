import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchasync";
import { IReqUser } from "../auth/auth.interface";


// const getProfile = catchAsync(async (req: Request, res: Response) => {
//   const result = await UserService.getProfile(req.user as IReqUser);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "User retrieved successfully",
//     data: result,
//   });
// });



export const EmployerController = {
};

