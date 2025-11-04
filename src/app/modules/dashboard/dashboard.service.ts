import httpStatus from "http-status";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ENUM_USER_ROLE } from "../../../enums/user";
import ApiError from "../../../errors/ApiError";
import { ICompany, IIngredients, IMenu, IOrders, IQuery, IQueryParams } from "./dashboard.interface";
import { AboutUs, Company, Ingredients, Menus, Notification, Orders, PrivacyPolicy, TermsConditions } from "./dashboard.model";
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
import { sendInvoiceByEmailHTML } from "../../../mails/invoice.mail";
import { generateInvoicePDF } from "../../../utils/pdfGenerator";
import fs from "fs";
import nodemailer, { Transporter } from 'nodemailer';

export const getTotalIncome = async () => {
    const result = await Orders.aggregate([
        {
            $match: {
                status: "complete",
                paymentStatus: "Paid",
            },
        },
        {
            $lookup: {
                from: "menus",
                localField: "menus_id",
                foreignField: "_id",
                as: "menu",
            },
        },
        { $unwind: "$menu" },
        {
            $group: {
                _id: null,
                totalIncome: { $sum: "$menu.price" },
            },
        },
    ]);

    return result.length > 0 ? result[0].totalIncome : 0;
};

export const createNotifications = async ({ userId, companyId, message, title }: any) => {
    await Notification.create({
        userId,
        companyId,
        message,
        title
    })
    return { message: "Notification created successfully" };

}
//  ===================================
const getUserNotifications = async (user: IReqUser) => {
    const { userId, role } = user;
    if (role === "EMPLOYER") {
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 })
        return { notifications };
    } else if (role === "COMPANY") {
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 })
        return { notifications };
    } else {
        throw new ApiError(403, "Only EMPLOYER and COMPANY roles can access notifications");
    }
}

const getDashboardUserOverview = async () => {
    const users = await Auth.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id": 1 } }, // sort by month
    ]);

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const result = months.map((m, i) => {
        const found = users.find(u => u._id === i + 1);
        return {
            month: m,
            users: found ? found.count : 0,
        };
    });

    return { result };
};

const getDashboardEarningOverview = async (year: number) => {
    const earnings = await Orders.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
                status: "complete",
                paymentStatus: "Paid",
            },
        },
        {
            $lookup: {
                from: "menus", // collection name in MongoDB
                localField: "menus_id",
                foreignField: "_id",
                as: "menu",
            },
        },
        { $unwind: "$menu" }, // flatten menu
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalIncome: { $sum: "$menu.price" },
            },
        },
        { $sort: { "_id": 1 } },
    ]);

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Format result
    const result = months.map((m, i) => {
        const found = earnings.find(e => e._id === i + 1);
        return {
            month: m,
            income: found ? found.totalIncome : 0,
        };
    });

    // Add yearly total
    const yearlyTotal = result.reduce((sum, m) => sum + m.income, 0);

    return { year, yearlyTotal, result };
};

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

    const newCompany = await Company.create(other);
    if (newCompany) {
        await createNotifications({
            userId: createAuth._id,
            companyId: newCompany._id,
            title: "Welcome to Business Food Service 🍽️",
            message: `Your company account has been created successfully. Start exploring our services!`
        })
    }
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

        const image: string = `/images/image/${files.image[0].filename}`;

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
        if (files?.image?.[0]) {
            payload.image = `/images/image/${files.image[0].filename}`;
        }

        if (payload.nutrition && typeof payload.nutrition === "string") {
            try {
                payload.nutrition = JSON.parse(payload.nutrition);
            } catch (parseError) {
                throw new ApiError(400, "Invalid nutrition format");
            }
        }

        console.log("Updating menu with payload:", payload);

        const updatedMenu = await Menus.findByIdAndUpdate(
            menuId,
            { $set: payload },
            { new: true, runValidators: true }
        );

        if (!updatedMenu) {
            throw new ApiError(404, "Menu not found");
        }

        return updatedMenu;

    } catch (error: any) {
        console.error("Update menu error:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Server error while updating menu");
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
        .rangeFilter()
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
    console.log('createScheduleOrder', userId, role);

    // Get menu info
    const menus = await Menus.findById(menus_id) as IMenu;
    if (!menus) throw new ApiError(404, "Menu not found!");

    let userTypes: "Company" | "Employer" = role === ENUM_USER_ROLE.EMPLOYER ? "Employer" : "Company";

    if (role === ENUM_USER_ROLE.EMPLOYER) {
        const employer = await Employer.findById(userId) as any;
        if (!employer) throw new ApiError(404, "Employer not found");
        company = new mongoose.Types.ObjectId(employer.company_id);
    }

    // -----------------------------
    // 🧩 Validation: Check existing orders for this employee on that day
    // -----------------------------
    const sameDayStart = new Date(date);
    sameDayStart.setHours(0, 0, 0, 0);
    const sameDayEnd = new Date(date);
    sameDayEnd.setHours(23, 59, 59, 999);

    const existingOrders = await Orders.find({
        user: userId,
        date: { $gte: sameDayStart, $lte: sameDayEnd },
    });

    // Count per mealType
    const mealCounts: Record<string, number> = {};
    for (const order of existingOrders) {
        mealCounts[order.mealType] = (mealCounts[order.mealType] || 0) + 1;
    }

    // Rules per mealType
    const rules: Record<string, number> = {
        Sopa: 1,
        Soup: 1,
        Plato_Principal: 1,
        Main_Course: 1,
        Guarnición: 2,
        Side_Dish: 2,
        Postre: 1,
        Dessert: 1,
        Vegano: 1,
        Vegan: 1,
        Diabetes: 1,
    };

    const maxAllowed = rules[menus.mealType] ?? 1;
    const currentCount = mealCounts[menus.mealType] ?? 0;

    if (currentCount >= maxAllowed) {
        throw new ApiError(
            400,
            `You have already selected the maximum allowed number of ${menus.mealType.replace('_', ' ')} for this day.`
        );
    }

    // -----------------------------
    // ✅ Create new order
    // -----------------------------
    const order = await Orders.create({
        user: userId,
        userTypes,
        company,
        mealType: menus.mealType,
        date: new Date(date),
        time: payload.time,
        status: "pending",
        menus_id,
    });

    console.log('order', order);
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

    console.log('=====', totalPrice)

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
): Promise<{ orders: IOrders[]; pagination: { page: number; total: number; limit: number, totalPage: number } }> => {

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
    const totalPage = Math.ceil(total / parseInt(limit));

    return {
        orders,
        pagination: {
            total,
            page: parseInt(page),
            totalPage,
            limit: parseInt(limit),
        }
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

    if (status === "complete") {
        await createNotifications({
            userId: updatedOrder.user,
            companyId: updatedOrder.company,
            title: "Order Completed 🍽️",
            message: `Your order with ID ${updatedOrder._id} has been marked as complete. Enjoy your meal!`
        })
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
const getAllCompanyPayment = async (query: any) => {
    let { year, month, page = 1, limit = 10, searchTerm } = query;
    // console.log("year, month", year, month)
    const now = new Date();

    year = year ? Number(year) : now.getFullYear();

    let monthNumber: number;
    let monthText: string;

    if (!month) {
        monthNumber = now.getMonth() + 1;
        monthText = now.toLocaleString("en-US", { month: "long" });
    } else if (!isNaN(Number(month))) {
        monthNumber = Number(month);
        monthText = new Date(`${year}-${monthNumber}-01`).toLocaleString("en-US", {
            month: "long",
        });
    } else {
        monthText = month;
        monthNumber = new Date(`${month} 1, ${year}`).getMonth() + 1;
    }

    const skip = (page - 1) * limit;

    const matchStage: any = { status: "active" };
    if (searchTerm) {
        matchStage.name = { $regex: searchTerm, $options: "i" };
    }

    const totalCompanies = await Company.countDocuments(matchStage);

    const totalPage = Math.ceil(totalCompanies / Number(limit));

    const pipeline: any[] = [
        { $match: matchStage },

        {
            $lookup: {
                from: "orders",
                let: { companyId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$company", "$$companyId"] },
                                    { $eq: [{ $year: "$date" }, Number(year)] },
                                    { $eq: [{ $month: "$date" }, monthNumber] },
                                ],
                            },
                            status: "complete"
                        },
                    },
                    {
                        $lookup: {
                            from: "menus",
                            localField: "menus_id",
                            foreignField: "_id",
                            as: "menu",
                        },
                    },
                    {
                        $unwind: {
                            path: "$menu",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            paymentStatus: 1,
                            price: "$menu.price",
                        },
                    },
                ],
                as: "orders",
            },
        },

        {
            $addFields: {
                totalOrder: { $size: "$orders" },
                totalPrice: { $sum: "$orders.price" },
                paymentStatus: {
                    $cond: [
                        {
                            $cond: [
                                { $eq: [{ $size: "$orders" }, 0] },
                                true,
                                { $allElementsTrue: { $map: { input: "$orders", as: "o", in: { $eq: ["$$o.paymentStatus", "Paid"] } } } }
                            ]
                        },
                        "Paid",
                        "Unpaid"
                    ],
                },
                month: monthText,
                year: year,
            },
        },

        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                totalOrder: 1,
                totalPrice: 1,
                paymentStatus: 1,
                month: 1,
                year: 1,
            },
        },

        { $skip: skip },
        { $limit: Number(limit) },
    ];

    const data = await Company.aggregate(pipeline);

    return {
        company: data,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCompanies,
            totalPage,
        },
    };
};

const updateCompanyPaymentMonthly = async (query: any) => {
    const { status, company_id, month, year } = query;

    if (!status || !company_id || !month || !year) {
        throw new ApiError(404, "Missing the required fields (status, company_id, month, year)!");
    }

    const company = await Company.findById(company_id);
    if (!company) {
        throw new ApiError(404, "Company id is wrong or company not found!");
    }

    const monthStart = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const result = await Orders.updateMany(
        {
            company: company_id,
            date: { $gte: monthStart, $lt: monthEnd }
        },
        {
            $set: { paymentStatus: status }
        }
    );

    if (result.modifiedCount === 0) {
        throw new ApiError(400, "No orders found for the specified company and month to update.");
    }
    if (result.modifiedCount > 0 && status === "Paid") {
        await createNotifications({
            userId: null,
            companyId: company._id,
            title: "Monthly Payment Updated 💰",
            message: `The payment status for your company's orders in ${monthStart.toLocaleString("en-US", { month: "long" })} ${year} has been updated to 'Paid'. Thank you for your prompt payment!`
        })
    }

    return {
        message: "Company monthly payments updated successfully!",
        modifiedCount: result,
    };
};

const getCompanyDetails = async (id: any) => {
    const company_id = id;

    if (!company_id) {
        throw new ApiError(404, "Missing the required fields company_id!");
    }

    const company = await Company.findById(company_id);
    if (!company) {
        throw new ApiError(404, "Company id is wrong or company not found!");
    }

    const [totalOrder, totalEmployers] = await Promise.all([
        Orders.countDocuments({ company: company_id }),
        Employer.countDocuments({ company: company_id })
    ]);

    return {
        totalOrder,
        totalEmployers,
        company
    };
};

const getCompanyEmployerOrder = async (company_id: string, query: any) => {
    const company = await Company.findById(company_id);
    if (!company) {
        throw new ApiError(404, "Company Not Found!");
    }
    let { year, month, page = 1, limit = 10, searchTerm } = query;
    console.log("year, month", year, month)

    if (!year || !month) {
        const now = new Date();
        year = year ? Number(year) : now.getFullYear();
        month = month ? month : now.toLocaleString("en-US", { month: "long" });
    }

    const skip = (page - 1) * limit;
    const monthNumber = new Date(`${month} 1, ${year}`).getMonth() + 1;

    // Match orders belonging to company and month/year
    const matchStage: any = {
        company: new mongoose.Types.ObjectId(company_id),
        $expr: {
            $and: [
                { $eq: [{ $year: "$date" }, Number(year)] },
                { $eq: [{ $month: "$date" }, monthNumber] },
            ],
        },
    };

    if (searchTerm) {
        // Match employer name or email (when userTypes = Employer)
        matchStage.$or = [
            { "employer.name": { $regex: searchTerm, $options: "i" } },
            { "employer.email": { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pipeline: any[] = [
        { $match: matchStage },
        {
            $lookup: {
                from: "employers", // collection name
                localField: "user", // order.user (ObjectId)
                foreignField: "_id",
                as: "employer",
            },
        },
        { $unwind: { path: "$employer", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "menus",
                localField: "menus_id",
                foreignField: "_id",
                as: "menu",
            },
        },
        { $unwind: { path: "$menu", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                mealType: 1,
                date: 1,
                status: 1,
                paymentStatus: 1,
                "employer._id": 1,
                "employer.name": 1,
                "employer.email": 1,
                "employer.profile_image": 1,
                "employer.phone_number": 1,
                menuName: "$menu.name",
                menuPrice: "$menu.price",
            },
        },
        { $skip: skip },
        { $limit: Number(limit) },
    ];

    const data = await Orders.aggregate(pipeline);

    // Count total matching orders
    const totalOrder = await Orders.aggregate([
        { $match: matchStage },
        { $count: "count" },
    ]);

    const totalCount = totalOrder.length > 0 ? totalOrder[0].count : 0;
    const totalPage = Math.ceil(totalCount / Number(limit));

    return {
        orders: data,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount,
            totalPage,
        },
    };
};

const getAdminEmployerProfile = async (user: IReqUser, query: any) => {
    const { userId } = user;
    const { page, searchTerm, limit } = query;

    if (query.searchTerm) {
        delete query.page;
    }

    const queryBuilder = new QueryBuilder<IEmployer>(
        Employer.find().populate({
            path: "authId",
            select: "is_block",
        }),
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

    return { employers, pagination };
};

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const sendInvoiceEmail = async (user: IReqUser, month: string) => {
    const { userId } = user;

    if (!month) throw new ApiError(400, "Month is required!");

    const company = await Company.findById(userId);
    if (!company) throw new ApiError(404, "Company not found!");

    const filter: any = { company: userId, status: "complete" };
    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    filter.date = { $gte: startDate, $lte: endDate };

    const orders = await Orders.find(filter)
        .populate({ path: "user", select: "name email address phone_number profile_image" })
        .populate({ path: "menus_id", select: "price" })
        .sort({ date: -1 });

    if (!orders.length) throw new ApiError(404, "No completed orders found for this month!");

    const totalPrice = orders.reduce((sum, order) => {
        const price = (order.menus_id as any)?.price || 0;
        return sum + price;
    }, 0);

    // generate PDF with logo
    const pdfPath = await generateInvoicePDF(
        orders as any,
        totalPrice,
        company.name || "Company",
    );

    const transporter = nodemailer.createTransport({
        host: config.smtp.smtp_host,
        port: parseInt(config.smtp.smtp_port as string),
        auth: { user: config.smtp.smtp_mail, pass: config.smtp.smtp_password },
    });

    const monthName = `${monthNames[monthNumber - 1]} ${year}`;

    await transporter.sendMail({
        from: config.smtp.smtp_mail,
        to: company.email,
        subject: `Invoice for ${monthName}`,
        html: sendInvoiceByEmailHTML({ name: company.name, month: monthName }),
        attachments: [
            { filename: `invoice-${month}.pdf`, path: pdfPath, contentType: "application/pdf" },
        ],
    });

    fs.unlinkSync(pdfPath);

    return { success: true, message: "Invoice sent successfully!" };
};


export const DashboardService = {
    sendInvoiceEmail,
    getDashboardEarningOverview,
    getDashboardUserOverview,
    getAdminEmployerProfile,
    getCompanyEmployerOrder,
    getCompanyDetails,
    getAllCompanyPayment,
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
    addRemoveFavorites,
    updateCompanyPaymentMonthly,
    getUserNotifications
};

