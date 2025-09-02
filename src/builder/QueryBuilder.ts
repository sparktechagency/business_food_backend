import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, any>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, any>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ["searchTerm", "sort", "page", "limit", "fields", "minCalories", "maxCalories", "minPrice", "maxPrice"];
    excludeFields.forEach((field) => delete queryObj[field]);

    this.modelQuery = this.modelQuery.find(queryObj);
    return this;
  }

  rangeFilter() {
    const filter: Record<string, any> = {};

    if (this.query.minCalories || this.query.maxCalories) {
      filter.calories = {};
      if (this.query.minCalories) filter.calories.$gte = Number(this.query.minCalories);
      if (this.query.maxCalories) filter.calories.$lte = Number(this.query.maxCalories);
    }

    if (this.query.minPrice || this.query.maxPrice) {
      filter.price = {};
      if (this.query.minPrice) filter.price.$gte = Number(this.query.minPrice);
      if (this.query.maxPrice) filter.price.$lte = Number(this.query.maxPrice);
    }

    if (Object.keys(filter).length > 0) {
      this.modelQuery = this.modelQuery.find(filter);
    }

    return this;
  }

  sort() {
    const sortBy = this?.query?.sort?.split(",").join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sortBy);
    return this;
  }

  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 9;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    const fields = this?.query?.fields?.split(",").join(" ") || "-__v";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  async countTotal() {
    const countQuery = this.modelQuery.model.find(this.modelQuery.getQuery());
    const total = await countQuery.countDocuments();
    return { total };
  }
}


export default QueryBuilder;
