import mongoose, { Document, Schema, Model } from "mongoose";
import { IEmployer } from "./employer.interface";



const EmployerSchema = new Schema<IEmployer>(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Auth",
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
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
      default: null,
    },
    phone_number: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "pending", "deactivate"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Employer: Model<IEmployer> = mongoose.model<IEmployer>("Employer", EmployerSchema);

export default Employer;
