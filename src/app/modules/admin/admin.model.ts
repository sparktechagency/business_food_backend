import mongoose, { Document, Model } from "mongoose";
import { IAdmin } from "./admin.interface";


const AdminSchema = new mongoose.Schema<IAdmin>(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Auth",
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
      required: true,
    },
    address: {
      type: String,
      default: null,
    },
    date_of_birth: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Statics
const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
