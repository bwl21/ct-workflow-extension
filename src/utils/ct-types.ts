/**
 * ChurchTools API Types for Custom Modules
 */

export interface CustomModule {
  id: number;
  name: string;
  shorty: string;
  icon?: string;
  color?: string;
  securityLevelId?: number;
}

export interface CustomModuleDataCategory {
  id: number;
  name: string;
  shorty: string;
  customModuleId: number;
  securityLevelId?: number;
  icon?: string;
  color?: string;
  data?: string | null;
  description?: string | null;
}

export interface CustomModuleDataCategoryCreate {
  name: string;
  shorty: string;
  customModuleId: number;
  securityLevelId?: number;
  icon?: string;
  color?: string;
  data?: string;
  description?: string;
}

export interface CustomModuleDataValue {
  id: number;
  dataCategoryId: number;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomModuleDataValueCreate {
  dataCategoryId: number;
  value: string;
}
