import QueryBuilder from "../../../builder/QueryBuilder";
import { ICompany, IQueryParams } from "./dashboard.interface";
import Company from "./dashboard.model";

const createCompany = async (payload: any) => {
    const newCompany = await Company.create(payload);
    return newCompany;
};

const updateCompany = async (id: string, payload: any) => {
    const updatedCompany = await Company.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
    );
    return updatedCompany;
};

const deleteCompany = async (id: string) => {
    const deletedCompany = await Company.findByIdAndDelete(id);
    return deletedCompany;
};

const getAllCompany = async (queryParams: IQueryParams) => {
    if (queryParams.searchTerm) {
        delete queryParams.page
    }

    const queryBuilder = new QueryBuilder<ICompany>(Company.find(), queryParams);

    let companyQuery = queryBuilder
        .search(["name", "address", "email"])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;

    const company = await companyQuery.exec();
    const pagination = await queryBuilder.countTotal();

    return { company, pagination };
};


export const DashboardService = {
    createCompany,
    getAllCompany,
    deleteCompany,
    updateCompany
};

