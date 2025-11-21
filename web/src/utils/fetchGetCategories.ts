import type { ItemCategory } from "./Interfaces.ts";

export default async function fetchGetCategories  (backendUrl:string) {
    try {
        const response = await fetch(`${backendUrl}/category/get-categories`, {
            credentials: 'include',
            method: 'GET',
        });

        if (!response.ok) return null;

        const categories: ItemCategory[] = await response.json();
        return categories;
    } catch {
        return null;
    }
};