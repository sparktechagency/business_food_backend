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

const ingredientsSchema = new Schema<IIngredients>(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
    },
    { timestamps: true }
);

const menuSchema = new Schema<IMenu>(
    {
        weekStart: { type: Date, required: true },
        weekEnd: { type: Date, required: true },
        mealType: {
            type: String,
            enum: ["Breakfast", "Lunch", "Dinner"],
            required: true,
        },
        image: { type: String },
        dishName: { type: String, required: true },
        description: { type: String },
        ratting: { type: Number, default: 5 },
        calories: { type: Number },
        quantity: { type: Number },
        price: { type: Number, required: true },
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
    },
    { timestamps: true }
);


const Menus: Model<IMenu> = mongoose.model<IMenu>("Menu", menuSchema);
const Company: Model<ICompany> = mongoose.model<ICompany>("Company", companySchema);
const Ingredients: Model<IIngredients> = mongoose.model<IIngredients>("Ingredients", ingredientsSchema);
const Orders: Model<IOrders> = mongoose.model<IOrders>("Orders", ordersSchema);



export { Company, Ingredients, Menus, Orders };
