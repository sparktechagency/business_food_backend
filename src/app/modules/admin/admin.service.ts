import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import Auth from "../auth/auth.model";
import { BlockUnblockPayload, IAdmin, IRequest } from "./admin.interface";
import Admin from "./admin.model";
import { ENUM_USER_ROLE } from "../../../enums/user";
import Customers from "../employer/employer.model";
import Employer from "../employer/employer.model";
import Company from "../dashboard/dashboard.model";

const blockUnblockAuthUser = async (payload: BlockUnblockPayload) => {
  const { role, email, is_block } = payload;
  console.log("Blocking/Unblocking User:", role, email, is_block);

  const updatedAuth = await Auth.findOneAndUpdate(
    { email, role },
    { $set: { is_block } },
    { new: true, runValidators: true }
  ).select("role name email is_block");

  if (!updatedAuth) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const statusValue = is_block ? "deactivate" : "active";

  if (role === ENUM_USER_ROLE.EMPLOYER) {
    const customer = await Employer.findOneAndUpdate(
      { authId: updatedAuth._id },
      { $set: { status: statusValue } }
    );
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Employer not found");
  } else if (role === ENUM_USER_ROLE.COMPANY) {
    const customer = await Company.findOneAndUpdate(
      { authId: updatedAuth._id },
      { $set: { status: statusValue } }
    );
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
  } else if (role === ENUM_USER_ROLE.ADMIN || role === ENUM_USER_ROLE.SUPER_ADMIN) {
    const admin = await Admin.findOneAndUpdate(
      { authId: updatedAuth._id },
      { $set: { status: statusValue } }
    );
    if (!admin) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }
  return updatedAuth;
};


export const AdminService = {
  blockUnblockAuthUser
};


