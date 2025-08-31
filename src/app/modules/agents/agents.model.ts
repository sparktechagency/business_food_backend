import mongoose, { Schema, Model } from 'mongoose';
import { ILocation, IAgents } from './agents.interface';

const locationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

// Define the Agents schema
const AgentsSchema = new Schema<IAgents>(
  {
    authId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Auth',
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: null,
    },
    location: {
      type: locationSchema,
    },
    phone_number: {
      type: String,
      default: null,
    },
    vehicleType: {
      type: Boolean,
      default: false,
    },
    profile_image: {
      type: String,
      default: null,
    },
    assignedParcels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
    }
    ],
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Agents: Model<IAgents> = mongoose.model<IAgents>('Agents', AgentsSchema);

export default Agents;
