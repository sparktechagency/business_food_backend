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
    plants: number;
    profile_image: string;
    employer: mongoose.Schema.Types.ObjectId[];
}


export interface IIngredients {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
    quantity: number;
    unit: string;
}

export interface IOrders {
    user: mongoose.Schema.Types.ObjectId;
    time: string;
    paymentStatus: string;
    userTypes: string;
    company: mongoose.Schema.Types.ObjectId;
    date: Date;
    status: string;
    menus_id: mongoose.Schema.Types.ObjectId;
    mealType: string;
    ratingValue: number;
    ratting: boolean;
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
    time: string;
    ratting: Number;
    weekStart: Date;
    weekEnd: Date;
    mealType: "Breakfast" | "Lunch" | "Dinner" | "Vegano" | "Diabetes" | "Soup" | "Dessert" | "Main_Course" | "Side_Dish" | "Vegan" | "Diabetes";
    image: string;
    notes: string,
    status: string;
    dishName: string;
    description?: string;
    assignTo?: string;
    assignCompany?: string;
    calories: number;
    price: number;
    quantity: number;
    nutrition: object[],
    favorite: string[]
}

export interface IQuery {
    page?: string;
    limit?: string;
    mealType?: string;
    menuId?: string;
    orderId?: string;
    status?: string;
    date?: string;
    month?: string;
}
