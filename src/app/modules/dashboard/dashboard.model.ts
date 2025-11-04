import mongoose, { Model, Schema } from "mongoose";
import { ICompany, IIngredients, IMenu, IOrders } from "./dashboard.interface";

const companySchema = new Schema<ICompany>(
    {
        name: { type: String, required: true },
        authId: { type: mongoose.Schema.Types.ObjectId, required: true },
        email: { type: String, required: true },
        profile_image: { type: String, default: null },
        address: { type: String, default: null },
        phone_number: { type: String, default: null },
        plants: {
            type: Number,
            default: null,
        },
        employer: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Employer",
            default: [],
        },
        status: {
            type: String,
            enum: ["pending", "active", "deactivate"],
            default: "active",
        },
    },
    { timestamps: true }
);

const ordersSchema = new Schema<IOrders>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "userTypes",
            required: true
        },
        userTypes: {
            type: String,
            enum: ["Company", "Employer"],
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        ratting: { type: Boolean, default: false },
        ratingValue: { type: Number, min: 1, max: 5 },
        mealType: {
            type: String,
            required: true,
        },
        menus_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true,
        },
        date: { type: Date, required: true },
        status: {
            type: String,
            enum: ["pending", "complete", "cancel"],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Unpaid"],
            default: "Unpaid"
        },
    },
    { timestamps: true }
);

const menuSchema = new Schema<IMenu>(
    {
        weekStart: { type: Date, required: true },
        weekEnd: { type: Date, required: true },
        mealType: {
            type: String,
            enum: ["Sopa", "Plato_Principal", "Guarnición", "Postre", "Diabetes", "Vegano", "Soup", "Dessert", "Main_Course", "Side_Dish", "Vegan", "Diabetes"],
            required: true,
        },
        image: { type: String },
        dishName: { type: String, required: true },
        description: { type: String },
        ratting: { type: Number, default: 0 },
        calories: { type: Number },
        quantity: { type: Number },
        price: { type: Number, required: true },
        favorite: { type: [String], ref: "Auth", default: [] },
        nutrition: {
            type: [Object],
            required: true,
        },
        notes: {
            type: String,
        },
        status: {
            type: String,
        }
    },
    { timestamps: true }
);

const ingredientsSchema = new Schema<IIngredients>(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
    },
    { timestamps: true }
);

const termsAndConditionsSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
        },
    }
);

const privacyPolicySchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
        },
    }
);

const aboutUsSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
        },
    }
);

const notificationSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
        message: { type: String, required: true },
        title: { type: String, required: true },
    },
    { timestamps: true }
);

const AboutUs = mongoose.model('AboutUs', aboutUsSchema);
const TermsConditions = mongoose.model('TermsConditions', termsAndConditionsSchema);
const PrivacyPolicy = mongoose.model('PrivacyPolicy', privacyPolicySchema);

const Orders: Model<IOrders> = mongoose.model<IOrders>("Orders", ordersSchema);
const Menus: Model<IMenu> = mongoose.model<IMenu>("Menu", menuSchema);
const Company: Model<ICompany> = mongoose.model<ICompany>("Company", companySchema);
const Ingredients: Model<IIngredients> = mongoose.model<IIngredients>("Ingredients", ingredientsSchema);
const Notification = mongoose.model("Notifications", notificationSchema);


export { Company, Ingredients, Menus, Orders, AboutUs, TermsConditions, PrivacyPolicy, Notification };
