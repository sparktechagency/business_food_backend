import httpStatus from "http-status";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ENUM_USER_ROLE } from "../../../enums/user";
import ApiError from "../../../errors/ApiError";
import { ICompany, IQueryParams } from "./dashboard.interface";
import Company from "./dashboard.model";
import Auth from "../auth/auth.model";
import sendEmail from "../../../utils/sendEmail";
import { companyAccountCreatedByAdminEmail } from "../../../mails/company.email";

const createCompany = async (payload: any) => {
    const { role, password, confirmPassword, email, ...other } = payload;

    if (!password || !confirmPassword || !email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email, Password, and Confirm Password are required!");
    }

    const existingAuth = await Auth.findOne({ email }).lean();
    if (existingAuth?.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
    }

    const auth = {
        role,
        name: other.name,
        email,
        password,
        isActive: true,
    };

    await sendEmail({
        email: auth.email,
        subject: "Activate Your Account",
        html: companyAccountCreatedByAdminEmail({
            user: { name: auth.name, password },
        }),
    }).catch((error: any) => console.error("Failed to send email:", error.message));

    let createAuth = await Auth.create(auth);
    if (!createAuth) {
        throw new ApiError(500, "Failed to create auth account");
    }

    other.authId = createAuth._id;
    other.email = email;

    const newCompany = await Company.create(other);
    return newCompany;
};

const updateCompany = async (id: string, payload: any) => {
    const updatedCompany = await Company.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
    );
    return updatedCompany;
};

const deleteCompany = async (id: string) => {
    const deletedCompany = await Company.findByIdAndDelete(id);
    return deletedCompany;
};

const getAllCompany = async (queryParams: IQueryParams) => {
    if (queryParams.searchTerm) {
        delete queryParams.page
    }

    const queryBuilder = new QueryBuilder<ICompany>(Company.find(), queryParams);

    let companyQuery = queryBuilder
        .search(["name", "address", "email"])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;

    const company = await companyQuery.exec();
    const pagination = await queryBuilder.countTotal();

    return { company, pagination };
};


export const DashboardService = {
    createCompany,
    getAllCompany,
    deleteCompany,
    updateCompany
};

