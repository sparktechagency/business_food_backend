import mongoose, { Document } from 'mongoose';

export interface ILocation {
    type: 'Point';
    coordinates: number[];
}

export interface ICompany {
    name: string;
    phone_number?: string;
    email: string;
    address: string;
    status: string;
}

export interface IQueryParams {
    searchTerm?: string;
    sort?: string;
    page?: number;
    limit?: number;
    fields?: string;
    [key: string]: any;
}
