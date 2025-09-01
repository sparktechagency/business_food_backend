import httpStatus from "http-status";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ENUM_USER_ROLE } from "../../../enums/user";
import ApiError from "../../../errors/ApiError";
import { ICompany, IIngredients, IMenu, IQueryParams } from "./dashboard.interface";
import { Company, Ingredients, Menus } from "./dashboard.model";
import Auth from "../auth/auth.model";
import sendEmail from "../../../utils/sendEmail";
import { companyAccountCreatedByAdminEmail } from "../../../mails/company.email";
import config from "../../../config";
import { Request, Response } from "express";

const createCompany = async (payload: any) => {
    const { password, confirmPassword, email, ...other } = payload;

    if ((password !== confirmPassword) || !email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email, Password, and Confirm Password are required!");
    }

    const existingAuth = await Auth.findOne({ email }).lean();
    if (existingAuth?.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
    }

    const auth = {
        role: "COMPANY",
        name: other.name,
        email,
        password,
        confirmPassword,
        isActive: true,
    };

    await sendEmail({
        email: auth.email,
        subject: `Welcome to ${config.app_name}`,
        html: companyAccountCreatedByAdminEmail({
            name: auth.name,
            email: auth.email,
            password,
        }),
    }).catch((error: any) => console.error("Failed to send email:", error.message));

    let createAuth = await Auth.create(auth);
    if (!createAuth) {
        throw new ApiError(500, "Failed to create auth account");
    }

    other.authId = createAuth._id;
    other.email = email;
    console.log("other", other)

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
// ===========================
const createIngredient = async (req: Request) => {
    try {
        const { name, quantity, unit } = req.body as IIngredients;

        if (!name || !quantity || !unit) {
            throw new ApiError(404, "All fields are required");
        }

        const newIngredient = await Ingredients.create({
            name,
            quantity,
            unit,
        });

        return newIngredient
    } catch (error) {
        throw new ApiError(400, "Server error while creating ingredient",);
    }
};

const deleteIngredient = async (req: Request) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(400, "Ingredient ID is required");
        }

        const deletedIngredient = await Ingredients.findByIdAndDelete(id);

        if (!deletedIngredient) {
            throw new ApiError(404, "Ingredient not found");
        }

        return {
            message: "Ingredient deleted successfully",
            data: deletedIngredient,
        };
    } catch (error) {
        console.error("Error deleting ingredient:", error);
        throw new ApiError(
            500,
            error instanceof Error ? error.message : "Server error while deleting ingredient"
        );
    }
};

const updateIngredient = async (req: Request) => {
    try {
        const { id } = req.params;
        const { name, quantity, unit } = req.body as Partial<IIngredients>;

        if (!id) {
            throw new ApiError(400, "Ingredient ID is required");
        }

        const updatedIngredient = await Ingredients.findByIdAndUpdate(
            id,
            { name, quantity, unit },
            { new: true, runValidators: true }
        );

        if (!updatedIngredient) {
            throw new ApiError(404, "Ingredient not found");
        }

        return {
            message: "Ingredient updated successfully",
            data: updatedIngredient,
        };
    } catch (error) {
        console.error("Error updating ingredient:", error);
        throw new ApiError(
            500,
            error instanceof Error ? error.message : "Server error while updating ingredient"
        );
    }
};

const getAllIngredients = async (queryParams: IQueryParams) => {
    if (queryParams.searchTerm) {
        delete queryParams.page;
    }

    const queryBuilder = new QueryBuilder<IIngredients>(
        Ingredients.find(),
        queryParams
    );

    let ingredientQuery = queryBuilder
        .search(["name", "unit"])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;

    const ingredients = await ingredientQuery.exec();
    const pagination = await queryBuilder.countTotal();

    return { ingredients, pagination };
};
// ==============================================
const createMenus = async (files: any, payload: IMenu) => {
    try {
        if (!files || !files.image || !files.image[0]) {
            throw new ApiError(400, "Image is required");
        }

        const image: string = `/images/profile/${files.image[0].filename}`;

        const newMenu = await Menus.create({ ...payload, image });

        return newMenu;
    } catch (error: any) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Server error while creating menu");
    }
};

const updateMenu = async (menuId: string, payload: Partial<IMenu>) => {
    try {
        const updatedMenu = await Menus.findByIdAndUpdate(
            menuId,
            { $set: payload },
            { new: true, runValidators: true }
        );

        if (!updatedMenu) {
            throw new ApiError(404, "Menu not found");
        }

        return updatedMenu;
    } catch (error) {
        throw new ApiError(400, "Server error while updating menu");
    }
};

const deleteMenu = async (menuId: string) => {
    try {
        const deletedMenu = await Menus.findByIdAndDelete(menuId);

        if (!deletedMenu) {
            throw new ApiError(404, "Menu not found");
        }

        return { message: "Menu deleted successfully", menu: deletedMenu };
    } catch (error) {
        throw new ApiError(400, "Server error while deleting menu");
    }
};

const getAllMenus = async (queryParams: IQueryParams) => {
    if (queryParams.searchTerm) {
        delete queryParams.page;
    }

    const queryBuilder = new QueryBuilder<IMenu>(
        Menus.find(),
        queryParams
    );

    let menusQuery = queryBuilder
        .search(["dishName", "mealType"])
        .filter()
        .sort()
        .dateFilter()
        .paginate()
        .fields()
        .modelQuery;

    const menus = await menusQuery.exec();
    const pagination = await queryBuilder.countTotal();

    return { menus, pagination };
};


export const DashboardService = {
    createMenus,
    updateMenu,
    deleteMenu,
    getAllMenus,
    createCompany,
    getAllCompany,
    deleteCompany,
    updateCompany,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    getAllIngredients,

};

