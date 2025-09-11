import httpStatus from "http-status";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ENUM_USER_ROLE } from "../../../enums/user";
import ApiError from "../../../errors/ApiError";
import { ICompany, IIngredients, IMenu, IOrders, IQuery, IQueryParams } from "./dashboard.interface";
import { AboutUs, Company, Ingredients, Menus, Orders, PrivacyPolicy, TermsConditions } from "./dashboard.model";
import Auth from "../auth/auth.model";
import sendEmail from "../../../utils/sendEmail";
import { companyAccountCreatedByAdminEmail } from "../../../mails/company.email";
import config from "../../../config";
import { Request, Response } from "express";
import { IReqUser } from "../auth/auth.interface";
import { IEmployer } from "../employer/employer.interface";
import Employer from "../employer/employer.model";
import mongoose, { Types } from "mongoose";
import AppError from "../../../errors/AppError";

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
        delete queryParams.page;
    }

    const queryBuilder = new QueryBuilder<ICompany>(Company.find(), queryParams);

    let companyQuery = queryBuilder
        .search(["name", "address", "email"])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;

    const companies = await companyQuery.exec();

    const companyIds = companies.map(c => c._id);
    const employerCounts = await Employer.aggregate([
        { $match: { company_id: { $in: companyIds }, status: "active" } },
        { $group: { _id: "$company_id", totalEmployers: { $sum: 1 } } },
    ]);

    const companyWithCounts = companies.map(c => {
        const countObj = employerCounts.find(ec => ec._id.toString() === c._id.toString());
        return {
            // @ts-ignore
            ...c.toObject(),
            totalEmployers: countObj ? countObj.totalEmployers : 0,
        };
    });

    const pagination = await queryBuilder.countTotal();

    return { company: companyWithCounts, pagination };
};

// =============================================
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
        const { nutrition } = payload;

        if (!files?.image?.[0]) {
            throw new ApiError(400, "Image is required");
        }

        const image: string = `/images/profile/${files.image[0].filename}`;

        if (nutrition) {
            if (typeof nutrition === "string") {
                payload.nutrition = JSON.parse(nutrition);
            }
        }

        const newMenu = await Menus.create({ ...payload, image });
        return newMenu;
    } catch (error: any) {
        console.error("Create menu error:", error.message);

        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Server error while creating menu");
    }
};

const updateMenu = async (files: any, menuId: string, payload: Partial<IMenu>) => {
    try {
        if (files?.image && files.image.length > 0) {
            payload.image = `/images/profile/${files.image[0].filename}`;
        }

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

const getAllMenus = async (queryParams: IQueryParams, authId: string) => {
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
        .paginate()
        .fields()
        .dateFilter()
        .modelQuery;

    let menus = await menusQuery.lean();
    const pagination = await queryBuilder.countTotal();

    menus = menus.map(menu => {
        // @ts-ignore
        const isFavorited = menu?.favorite?.some((id: any) => id.toString() === authId.toString());
        return {
            ...menu,
            favorite: isFavorited
        };
    });

    return { menus, pagination };
};

const getMenusSuggested = async () => {
    const menus = await Menus.find().sort({ ratting: -1 }).limit(10);

    return menus;
};

const getMenusByDate = async (
    query: { date: string; page?: string; limit?: string },
    user: IReqUser
) => {
    const { date, page = "1", limit = "10" } = query;
    const { userId } = user;

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
        throw new Error("Please provide a valid date in format YYYY-MM-DD");
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("date", startOfDay, endOfDay)

    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const menus = await Orders.find({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
    }).populate('menus_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await Orders.countDocuments({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
    });

    return {
        data: menus,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

const getMenuDetails = async (id: string, authId: string) => {
    let details = await Menus.findById(id).lean();
    if (!details) {
        throw new ApiError(404, "Menu not found!");
    }

    const isFavorited = details.favorite?.some(
        (fid: any) => fid.toString() === authId.toString()
    );


    let relatedMenus = await Menus.find({
        mealType: details.mealType,
    })
        .limit(6)
        .lean();

    // @ts-ignore
    relatedMenus = relatedMenus.map(menu => {
        const isFavorited = menu.favorite?.some(
            (fid: any) => fid.toString() === authId.toString()
        );
        return {
            ...menu,
            favorite: isFavorited,
        };
    });

    return {
        details: {
            ...details,
            favorite: isFavorited,
        },
        relatedMenus,
    };
};

const getEmployerProfile = async (user: IReqUser, query: any) => {
    console.log()
    const { userId } = user;
    const { page, searchTerm, limit } = query

    if (query.searchTerm) {
        delete query.page;
    }

    const queryBuilder = new QueryBuilder<IEmployer>(
        Employer.find({ company_id: userId }),
        query
    );

    let employerQuery = queryBuilder
        .search(["name", "email"])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;

    const employers = await employerQuery.exec();
    const pagination = await queryBuilder.countTotal();

    console.log("pagination", pagination)

    return { employers, pagination };
};

const createScheduleOrder = async (user: IReqUser, payload: any): Promise<IOrders> => {
    const { userId, role } = user;
    const { menus_id, date } = payload;

    let company = new mongoose.Types.ObjectId(userId);

    const menus = await Menus.findById(menus_id) as IMenu
    if (!menus) {
        throw new ApiError(404, "Menu not found!")
    }

    let userTypes: "Company" | "Employer" = role === ENUM_USER_ROLE.EMPLOYER ? "Employer" : "Company";

    if (role === ENUM_USER_ROLE.EMPLOYER) {
        const employer = await Employer.findById(userId) as any;
        if (!employer) throw new ApiError(404, "Employer not found");

        company = new mongoose.Types.ObjectId(employer.company_id);
    }

    const order = await Orders.create({
        user: userId,
        userTypes,
        company,
        mealType: menus.mealType,
        date: new Date(date),
        status: "pending",
        menus_id
    })

    return order;
};

const getUserOrders = async (
    user: IReqUser,
    query: IQuery
): Promise<{ orders: IOrders[]; total: number; page: number; limit: number }> => {
    const { userId, role } = user;
    const { page = "1", limit = "10", mealType, status, date } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: any = {};
    if (role === "EMPLOYER") filter.user = userId;
    if (role === "COMPANY") filter.company = userId;

    if (mealType) filter.mealType = mealType;
    if (status) filter.status = status;
    if (date) {
        const dayStart = new Date(date);
        if (isNaN(dayStart.getTime())) {
            throw new Error("Invalid date format. Please use a valid date.");
        }
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    const total = await Orders.countDocuments(filter);

    const orders = await Orders.find(filter)
        .populate({
            path: "user",
            select: "name email address phone_number profile_image",
        })
        .populate({
            path: "menus_id",
            select: "-nutrition",
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    return {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
    };
};

// =============================================
const getUserInvoice = async (
    user: IReqUser,
    query: IQuery
): Promise<{ orders: IOrders[]; total: number; totalPrice: number }> => {
    const { userId, role } = user;
    const { page = "1", limit = "10", mealType, status, month } = query;

    if (role !== "COMPANY") {
        throw new Error("Unauthorized: Only COMPANY role can access orders.");
    }

    // const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: any = { company: userId };

    if (mealType) filter.mealType = mealType;
    if (status) filter.status = status;

    if (month) {
        const [year, monthNumber] = month.split("-").map(Number);
        const startDate = new Date(year, monthNumber - 1, 1);
        const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
        filter.date = { $gte: startDate, $lte: endDate };
    }

    const total = await Orders.countDocuments(filter);

    const orders = await Orders.find(filter)
        .populate({
            path: "user",
            select: "name email address phone_number profile_image",
        })
        .populate({
            path: "menus_id",
            select: "price",
        })
        .sort({ date: -1 });

    const totalPrice = orders.reduce((sum, order) => {
        const price = (order.menus_id as any)?.price || 0;
        return sum + price;
    }, 0);

    return {
        orders,
        total,
        totalPrice,
    };
};

// =============================================
const addRemoveFavorites = async (authId: string, menuId: Types.ObjectId) => {
    const menu = await Menus.findById(menuId);
    if (!menu) {
        throw new ApiError(404, "menu not found");
    }

    const isFavorited = menu.favorite.includes(authId);

    if (isFavorited) {
        menu.favorite = menu.favorite.filter(id => id.toString() !== authId.toString());
    } else {
        menu.favorite.push(authId);
    }

    await menu.save();
    return { message: isFavorited ? "Removed from favorites" : "Added to favorites" };
};

const getUserFavorites = async (user: IReqUser) => {
    const authId = user.authId;

    const recipes = await Menus.find({ favorite: authId })
        .lean();

    const updatedRecipes = recipes.map(recipe => ({
        ...recipe,
        favorite: true
    }));

    return { recipes: updatedRecipes };
};

const sendReviews = async (payload: {
    menuId: string;
    orderId: string;
    ratting: string;
}) => {
    const { menuId, orderId, ratting } = payload;

    const ratingValue = Number(ratting);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
    }

    const menu = await Menus.findById(menuId);
    if (!menu) throw new ApiError(404, "Menu not found");

    const sum = (Number(menu?.ratting) | 0) + ratingValue;
    const avgRating = Number(sum) / 2;
    menu.ratting = Number(avgRating.toFixed(1));
    await menu.save();

    const order = await Orders.findByIdAndUpdate(orderId, { ratting: true, ratingValue: ratingValue }, { new: true });

    return {
        message: "Review submitted successfully",
        order
    };
};

const deleteEmployerProfiles = async (userId: string, profileId: string) => {

    const employer = await Employer.findById(profileId)
    if (!employer) {
        throw new ApiError(404, 'Employer not found!')
    }

    if (employer.company_id.toString() !== userId.toString()) {
        throw new ApiError(403, 'You are not the owner of this Employer profile!');
    }
    await Employer.findByIdAndDelete(profileId);
    return {
        message: 'Employer profile deleted successfully',
    };
};

// ============================================
const getAllOderAdmin = async (
    query: IQuery
): Promise<{ orders: IOrders[]; total: number; page: number; limit: number }> => {

    const { page = "1", limit = "10", mealType, status, date } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: any = {};

    if (mealType) filter.mealType = mealType;
    if (status) filter.status = status;
    if (date) {
        const dayStart = new Date(date);
        if (isNaN(dayStart.getTime())) {
            throw new Error("Invalid date format. Please use a valid date.");
        }
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    const total = await Orders.countDocuments(filter);

    const orders = await Orders.find(filter)
        .populate({
            path: "user",
            select: "name email address phone_number profile_image",
        })
        .populate({
            path: "menus_id",
            select: "-nutrition",
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    return {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
    };
};

const updateOrderStatus = async (query: IQuery) => {
    const { orderId, status } = query;
    if (!orderId || !status) {
        throw new AppError(404, "Missing the require finds")
    }

    const allowedStatuses = ["pending", "in-progress", "complete", "cancel"];
    if (!allowedStatuses.includes(status)) {
        throw new AppError(400, `Invalid status value: ${status}`);
    }

    const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true }
    );

    if (!updatedOrder) {
        throw new AppError(404, "Order not found");
    }

    return updatedOrder
};

// ======================
const addTermsConditions = async (payload: any) => {
    const checkIsExist = await TermsConditions.findOne();
    if (checkIsExist) {
        return await TermsConditions.findOneAndUpdate({}, payload, {
            new: true,

            runValidators: true,
        });
    } else {
        return await TermsConditions.create(payload);
    }
};

const getTermsConditions = async () => {
    return await TermsConditions.findOne();
};

const addPrivacyPolicy = async (payload: any) => {
    const checkIsExist = await PrivacyPolicy.findOne();
    if (checkIsExist) {
        return await PrivacyPolicy.findOneAndUpdate({}, payload, {
            new: true,

            runValidators: true,
        });
    } else {
        return await PrivacyPolicy.create(payload);
    }
};

const getPrivacyPolicy = async () => {
    return await PrivacyPolicy.findOne();
};

const addAboutUs = async (payload: any) => {
    const checkIsExist = await AboutUs.findOne();
    if (checkIsExist) {
        return await AboutUs.findOneAndUpdate({}, payload, {
            new: true,

            runValidators: true,
        });
    } else {
        return await AboutUs.create(payload);
    }
};

const getAboutUs = async () => {
    return await AboutUs.findOne();
};
// ======================================

export const DashboardService = {
    addAboutUs,
    getAboutUs,
    addPrivacyPolicy,
    getPrivacyPolicy,
    addTermsConditions,
    getTermsConditions,
    updateOrderStatus,
    getAllOderAdmin,
    deleteEmployerProfiles,
    sendReviews,
    getUserFavorites,
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
    getMenusSuggested,
    getMenusByDate,
    getMenuDetails,
    getEmployerProfile,
    createScheduleOrder,
    getUserOrders,
    getUserInvoice,
    addRemoveFavorites
};

