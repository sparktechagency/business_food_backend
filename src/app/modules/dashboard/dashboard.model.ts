import mongoose, { Model, Schema } from "mongoose";
import { ICompany } from "./dashboard.interface";

// Define the Agents schema
const companySchema = new Schema<ICompany>(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        profile_image: {
            type: String,
        },
        address: {
            type: String,
            default: null,
        },
        phone_number: {
            type: String,
            default: null,
        },
        employer: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Employer",
            default: [],
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'deactivate'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);

export default Company;