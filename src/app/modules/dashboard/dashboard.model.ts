import mongoose, { Model, Schema } from "mongoose";
import { ICompany, IIngredients, IMenu } from "./dashboard.interface";

const companySchema = new Schema<ICompany>(
    {
        name: { type: String, required: true },
        authId: { type: mongoose.Schema.Types.ObjectId, required: true },
        email: { type: String, required: true },
        profile_image: { type: String },
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
        // assignTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        // assignCompany: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
        calories: { type: Number },
    },
    { timestamps: true }
);

const Menus: Model<IMenu> = mongoose.model<IMenu>("Menu", menuSchema);
const Company: Model<ICompany> = mongoose.model<ICompany>("Company", companySchema);
const Ingredients: Model<IIngredients> = mongoose.model<IIngredients>("Ingredients", ingredientsSchema);

export { Company, Ingredients, Menus };
