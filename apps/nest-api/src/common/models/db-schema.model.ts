export interface BaseEntity {
  id: string;
}

export interface Vehicle extends BaseEntity {
  licensePlate: string;
  chassi: string;
  renavam: string;
  model: string;
  carBrand: number;
  year: string | number;
  category: number;
  image: string;
}

export interface Brand extends BaseEntity {
  name: string;
}

export interface Category extends BaseEntity {
  description: string;
}

export interface DbSchema {
  vehicles: Vehicle[];
  brands: Brand[];
  categories: Category[];
}

export type DbEntity = keyof DbSchema;

export const EMPTY_DB: DbSchema = {
  vehicles: [],
  brands: [],
  categories: [],
};
