import type { ItemSubcategory } from "./Interfaces.ts";

export default async function fetchGetSubcategories  (backendUrl:string) {
    try {
        const response = await fetch(`${backendUrl}/category/get-subcategories`, {
            credentials: 'include',
            method: 'GET',
        });

        if (!response.ok) return null;

        const subcategories: ItemSubcategory[] = await response.json();
        return subcategories;
    } catch {
        return null;
    }
};