/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import mongoose, { Document, Model } from 'mongoose';

export interface IRequest extends Request {
  user: {
    userId: string;
    authId: string;
  };
}

export type IAdmin = Document & {
  _id: mongoose.Schema.Types.ObjectId;
  authId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  profile_image?: string | null;
  phone_number: string;
  address?: string | null;
  date_of_birth?: string | null;
}
export interface BlockUnblockPayload {
  role: string;
  email: string;
  is_block: boolean;
}