export interface User {
    id: number;
    name: string;
    pictureUrl: string | null;
}
export interface ItemCategory {
    id: number;
    name: string;
}
export interface ItemSubcategory {
    id: number;
    name: string;
    itemCategoryId: number;
}
export interface BudgetEntry {
    itemCategoryId: number;
    itemSubcategoryId: number;
    planned: number;
    real: number;
}
export interface MonthlyBudget {
    month: number;
    year: number;
    entries: BudgetEntry[];
}
export interface SubcategoryMap {
    [subcategoryId: number]: {
        planned: number;
        real: number;
    };
}
export interface CategoryMap {
    [categoryId: number]: SubcategoryMap;
}
export interface BudgetEntrySubcategory {
    id: number;
    planned: number;
    real: number;
}
export interface BudgetEntryCategory {
    id: number;
    subcategories: BudgetEntrySubcategory[];
}
export type BudgetEntryNestedList = BudgetEntryCategory[];

export const backendUrl = import.meta.env.VITE_BACKEND_ADDRESS;
export const COLORS = ['#077a7d', '#564d80', '#0CCE6B', '#ff9800', '#d81e5b', '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#005f73'];