import React, { useState } from "react";
import type { BudgetEntryNestedList, ItemCategory, ItemSubcategory } from "../utils/Interfaces.ts";

type Props = {
    budgetEntries: BudgetEntryNestedList | null;
    setBudgetEntries: React.Dispatch<React.SetStateAction<BudgetEntryNestedList | null>>;
    itemCategories: ItemCategory[];
    itemSubcategories: ItemSubcategory[];
};

const EntryForm: React.FC<Props> = ({
                                        budgetEntries,
                                        setBudgetEntries,
                                        itemCategories,
                                        itemSubcategories,
                                    }) => {
    const [categoryToAdd, setCategoryToAdd] = useState<number>(1);
    const [subcategoryToAdd, setSubcategoryToAdd] = useState<number>(1);

    const submitHandler = async () => {
        if (!categoryToAdd) return;

        let subcategoryToAddNew = subcategoryToAdd

        if (subcategoryToAdd === 0) {
            subcategoryToAddNew = itemSubcategories.find(i => i.name === "" && i.itemCategoryId === categoryToAdd)!.id
        }

        const updatedEntries = budgetEntries
            ? [...budgetEntries.map(b => ({
                ...b,
                subcategories: [...b.subcategories]
            }))]
            : [];

        const catIndex = updatedEntries.findIndex(b => b.id === categoryToAdd);

        if (catIndex !== -1) {
            const cat = updatedEntries[catIndex];
            const subExists = cat.subcategories.some(b => b.id === subcategoryToAddNew);

            if (!subExists) {
                cat.subcategories.push({ id: subcategoryToAddNew, planned: 0, real: 0 });
            }
        } else {
            updatedEntries.push({
                id: categoryToAdd,
                subcategories: [{ id: subcategoryToAddNew, planned: 0, real: 0 }]
            });
        }

        setBudgetEntries(updatedEntries);
    }

    return (
        <div className="flex flex-col sm:flex-row justify-around flex-wrap gap-y-2 gap-x-4 w-full">
            <select
                className="border-1 w-full cursor-pointer sm:w-48 bg-c-primary p-1 border-c-white/50 rounded"
                value={categoryToAdd}
                onChange={(e) => {
                    setCategoryToAdd(parseInt(e.target.value))
                    setSubcategoryToAdd(0)
                }}>
                {itemCategories.map((itemCategory) => (
                    <option key={itemCategory.id} value={itemCategory.id}>
                        {itemCategory.name}
                    </option>
                ))}
            </select>

            <select
                className="border-1 w-full cursor-pointer sm:w-48 bg-c-primary p-1 border-c-white/50 rounded"
                value={subcategoryToAdd}
                onChange={(e) => setSubcategoryToAdd(parseInt(e.target.value))}>
                {itemSubcategories
                    .filter((i) => i.itemCategoryId == categoryToAdd)
                    .map((itemSubcategory) => (
                        <option key={itemSubcategory.id} value={itemSubcategory.id}>
                            {itemSubcategory.name}
                        </option>
                    ))}
            </select>

            <button
                className="border-2 w-full sm:w-auto px-8 bg-c-primary py-1 border-c-green hover:border-c-green/80 rounded cursor-pointer"
                onClick={submitHandler}>
                Add
            </button>
        </div>
    );
};

export default EntryForm;
