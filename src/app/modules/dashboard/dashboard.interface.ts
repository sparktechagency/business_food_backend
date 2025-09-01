import mongoose, { Document, ObjectId } from 'mongoose';

export interface ILocation {
    type: 'Point';
    coordinates: number[];
}

export interface ICompany {
    _id: mongoose.Schema.Types.ObjectId;
    authId: mongoose.Schema.Types.ObjectId;
    name: string;
    phone_number?: string;
    email: string;
    address: string;
    status: string;
    profile_image: string;
    employer: mongoose.Schema.Types.ObjectId[];
}


export interface IIngredients {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
    quantity: number;
    unit: string;
}
export interface IQueryParams {
    searchTerm?: string;
    sort?: string;
    page?: number;
    limit?: number;
    fields?: string;
    [key: string]: any;
}


export interface IMenu {
    weekStart: Date;
    weekEnd: Date;
    mealType: "Breakfast" | "Lunch" | "Dinner";
    image: string;
    dishName: string;
    description?: string;
    assignTo?: string;
    assignCompany?: string;
    calories: number;
}