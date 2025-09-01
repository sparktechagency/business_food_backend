import mongoose, { Document } from "mongoose";

export type IEmployer = Document & {
  _id: mongoose.Schema.Types.ObjectId;
  company_id: mongoose.Schema.Types.ObjectId;
  authId: mongoose.Schema.Types.ObjectId;
  employer_id: mongoose.Schema.Types.ObjectId;
  name: string;
  email: string;
  profile_image?: string | null;
  phone_number?: string | null;
  status: "active" | "deactivate";
  createdAt?: Date;
  updatedAt?: Date;
}