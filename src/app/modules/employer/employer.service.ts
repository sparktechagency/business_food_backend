import ApiError from "../../../errors/ApiError";

import Auth from "../auth/auth.model";
import Employer from "./employer.model";
import { IReqUser } from "../auth/auth.interface";

const approvedAccount = async (
    users: IReqUser,
    payload: { status: string; employerId: string }
) => {
    const { status, employerId } = payload;
    const { userId } = users;

    console.log("status", status, employerId)

    const account = await Employer.findById(employerId);
    if (!account) {
        throw new ApiError(404, "Employer account not found");
    }

    if (account.company_id.toString() !== userId.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to access this employer account"
        );
    }

    const [updatedAuth, updatedEmployer] = await Promise.all([
        Auth.findOneAndUpdate(
            { email: account.email },
            { isActive: status === "active" ? true : false },
            { new: true }
        ),
        Employer.findByIdAndUpdate(employerId, { status }, { new: true }),
    ]);

    if (!updatedAuth) {
        throw new ApiError(404, "Employer account not found in login auth");
    }

    if (!updatedEmployer) {
        throw new ApiError(404, "Employer details not found");
    }

    return { updatedEmployer, message: "Account approved successfully" };
};


const approvedAccountAdmin = async (
    users: IReqUser,
    payload: { status: string; employerId: string }
) => {
    const { status, employerId } = payload;
    const { userId } = users;

    console.log("status", status, employerId)

    const account = await Employer.findById(employerId);
    if (!account) {
        throw new ApiError(404, "Employer account not found");
    }



    const [updatedAuth, updatedEmployer] = await Promise.all([
        Auth.findOneAndUpdate(
            { email: account.email },
            { isActive: status === "active" ? true : false },
            { new: true }
        ),
        Employer.findByIdAndUpdate(employerId, { status }, { new: true }),
    ]);

    if (!updatedAuth) {
        throw new ApiError(404, "Employer account not found in login auth");
    }

    if (!updatedEmployer) {
        throw new ApiError(404, "Employer details not found");
    }

    return { updatedEmployer, message: "Account approved successfully" };
};



export const EmployerService = {
    approvedAccount,
    approvedAccountAdmin
};

