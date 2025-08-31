import { Request, RequestHandler, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import { AdminService } from './admin.service';
import sendResponse from '../../../shared/sendResponse';

const blockUnblockAuthUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.blockUnblockAuthUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful!",
    data: result,
  });
});


export const AdminController = {
  blockUnblockAuthUser,
};