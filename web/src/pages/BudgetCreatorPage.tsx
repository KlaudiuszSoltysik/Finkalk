import React, { useEffect, useState } from "react";
import fetchGetUser from "../utils/fetchGetUser.ts";
import {
    backendUrl,
    type BudgetEntry,
    type BudgetEntryNestedList,
    type BudgetEntrySubcategory,
    type CategoryMap,
    type ItemCategory,
    type ItemSubcategory,
    type MonthlyBudget,
    type User
} from "../utils/Interfaces.ts";
import fetchCheckLogin from "../utils/fetchCheckLogin.ts";
import Navbar from "../components/Navbar.tsx";
import Statistics from "../components/Statistics.tsx";
import MonthSelector from "../components/MonthSelector.tsx";
import EntryForm from "../components/EntryForm.tsx";
import fetchGetCategories from "../utils/fetchGetCategories.ts";
import fetchGetSubcategories from "../utils/fetchGetSubcategories.ts";
import { useNavigate } from "react-router-dom";
import formatMoney from "../utils/formatMoney.ts";

interface BudgetEntryPost {
    itemSubcategoryId: number;
    planned: number;
    real: number;
}

export default function BudgetCreatorPage() {
    const date = new Date();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [itemCategories, setItemCategories] = useState<ItemCategory[] | null>(null);
    const [itemSubcategories, setItemSubcategories] = useState<ItemSubcategory[] | null>(null);
    const [budgetEntries, setBudgetEntries] = useState<BudgetEntryNestedList | null>(null);
    const [month, setMonth] = useState<number>(date.getMonth());
    const [year, setYear] = useState<number>(date.getFullYear());
    const [editingReal, setEditingReal] = useState<Record<number, string>>({});
    const [editingPlanned, setEditingPlanned] = useState<Record<number, string>>({});

    useEffect(() => {
        const fetchUser = async () => {
            const isLogged = await fetchCheckLogin(backendUrl);

            if (!isLogged) navigate('/login', { state: { endpoint: '' } })

            const user = await fetchGetUser(backendUrl);

            if (user == null) navigate('/login', { state: { endpoint: '' } })

            setUser(user);
        };

        fetchUser()
    }, [navigate]);

    useEffect(() => {
        const fun = async () => {
            return setItemCategories(await fetchGetCategories(backendUrl))
        }

        fun()
    }, []);

    useEffect(() => {
        const fun = async () => {
            return setItemSubcategories(await fetchGetSubcategories(backendUrl))
        }

        fun()
    }, []);

    useEffect(() => {
        if (itemCategories == null || itemSubcategories == null) return;

        const handler = setTimeout(() => {
            getBudget();
        }, 750);

        return () => clearTimeout(handler);

    }, [month, year, itemCategories, itemSubcategories]);

    useEffect(() => {
        submitHandler();
    }, [budgetEntries]);

    const getBudget = async () => {
        const fetchBudget = async () => {
            try {
                const response = await fetch(`${backendUrl}/budget/get-budget?month=${month}&year=${year}`, {
                    credentials: 'include',
                    method: 'GET',
                });

                if (!response.ok) return null;

                const budgetResponse: MonthlyBudget = await response.json();
                return budgetResponse;
            } catch {
                return null;
            }
        };

        const budgetResponse = await fetchBudget();

        if (budgetResponse == null) return;

        const entries: BudgetEntry[] = budgetResponse.entries.map(budgetEntry => ({
            itemCategoryId: itemSubcategories!.find(i => i.id === budgetEntry.itemSubcategoryId)!.itemCategoryId,
            itemSubcategoryId: budgetEntry.itemSubcategoryId,
            planned: budgetEntry.planned,
            real: budgetEntry.real
        })) ?? [];

        const grouped: Record<number, Record<number, Omit<BudgetEntrySubcategory, 'id'>>> = entries.reduce((acc, entry) => {
            const { itemCategoryId, itemSubcategoryId, planned, real } = entry;

            if (!acc[itemCategoryId]) {
                acc[itemCategoryId] = {};
            }

            acc[itemCategoryId][itemSubcategoryId] = { planned, real };

            return acc;
        }, {} as CategoryMap);

        const categoryList: BudgetEntryNestedList = Object.entries(grouped)
            .map(([categoryIdStr, subcategories]) => {
                const subcategoryList: BudgetEntrySubcategory[] = Object.entries(subcategories)
                    .map(([subcategoryIdStr, values]) => ({
                        id: Number(subcategoryIdStr),
                        ...values
                    }))
                    .sort((a, b) => b.planned - a.planned);

                return {
                    id: Number(categoryIdStr),
                    subcategories: subcategoryList
                };
            });

        const sortedCategoryList = categoryList.sort((a, b) => {
            const totalA = a.subcategories.reduce((sum, sub) => sum + sub.planned, 0);
            const totalB = b.subcategories.reduce((sum, sub) => sum + sub.planned, 0);
            return totalB - totalA;
        });

        setBudgetEntries(sortedCategoryList);
    };

    const submitHandler = async () => {
        if (!budgetEntries) return

        const entries: BudgetEntryPost[] = budgetEntries.flatMap(category =>
            category.subcategories.map(sub => ({
                itemSubcategoryId: sub.id,
                planned: sub.planned,
                real: sub.real
            }))
        );

        try {
            await fetch(`${backendUrl}/budget/save-budget`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ month, year, budgetEntries: entries })
            });
        } catch {
            return null;
        }
    }

    const onChangePlanned = (e: React.ChangeEvent<HTMLInputElement>, sub: BudgetEntrySubcategory) => {
        const raw = e.target.value;
        const normalized = raw.replace(',', '.');

        const parts = normalized.split('.');
        if (parts.length === 2 && parts[1].length > 2) {
            return;
        }

        setEditingPlanned(prev => ({
            ...prev,
            [sub.id]: raw.replace(/\s/g, ""),
        }));

        const parsed = parseFloat(normalized);
        if (!isNaN(parsed)) {
            const updatedEntries = budgetEntries!.map((cat) => ({
                ...cat,
                subcategories: cat.subcategories.map((s) =>
                    s.id === sub.id ? { ...s, planned: parsed } : s
                ),
            }));

            setBudgetEntries(updatedEntries);
        }
    }

    const onChangeReal = (e: React.ChangeEvent<HTMLInputElement>, sub: BudgetEntrySubcategory) => {
        const raw = e.target.value;
        const normalized = raw.replace(',', '.');

        const parts = normalized.split('.');
        if (parts.length === 2 && parts[1].length > 2) {
            return;
        }

        setEditingReal(prev => ({
            ...prev,
            [sub.id]: raw.replace(/\s/g, ""),
        }));

        const parsed = parseFloat(normalized);
        if (!isNaN(parsed)) {
            const updatedEntries = budgetEntries!.map((cat) => ({
                ...cat,
                subcategories: cat.subcategories.map((s) =>
                    s.id === sub.id ? { ...s, real: parsed } : s
                ),
            }));

            setBudgetEntries(updatedEntries);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-c-primary text-c-white font-poppins">
            {user && <Navbar user={user} path=""/>}
            {itemCategories && itemSubcategories ? (
                <div className="w-5/6 lg:w-4/6 mx-auto py-4">
                    {budgetEntries && (
                        <Statistics budgetEntries={budgetEntries} itemCategories={itemCategories}
                                    itemSubcategories={itemSubcategories} advanced={false}/>
                    )}
                    <div className="flex justify-center">
                        <MonthSelector month={month} setMonth={setMonth} year={year} setYear={setYear} date={date}/>
                    </div>
                    <EntryForm
                        budgetEntries={budgetEntries}
                        setBudgetEntries={setBudgetEntries}
                        itemCategories={itemCategories}
                        itemSubcategories={itemSubcategories}
                    />
                    {budgetEntries && (
                        budgetEntries.map((cat) => (
                            <div className="bg-c-black/50 my-2 px-4 py-2 rounded-xl" key={cat.id}>
                                <div
                                    className="flex mb-2 pb-2 border-b-c-white border-b-1 font-bold flex-wrap items-center gap-x-4 justify-around md:justify-between">
                                    <div className="flex w-48 flex-wrap items-center gap-x-4 justify-start">
                                        <p className="text-c-red cursor-pointer hover:text-c-red/80"
                                           onClick={() => {
                                               setBudgetEntries(budgetEntries.filter(n => n.id !== cat.id))
                                           }}>&times;</p>
                                        <p>{itemCategories.find(c => c.id === cat.id)!.name}</p>
                                    </div>
                                    <div
                                        className="flex flex-wrap items-center gap-x-4 justify-around md:justify-between">
                                        <div className="flex flex-wrap w-48 items-center gap-x-4 justify-between">
                                            <p>Planned:</p>
                                            <p className="w-24 px-2">{formatMoney(cat.subcategories.reduce((acc, s) => acc + s.planned, 0))}</p>
                                        </div>
                                        <div className="flex flex-wrap w-48 items-center gap-x-4 justify-between">
                                            <p>Real:</p>
                                            <p className="w-24 px-2">{formatMoney(cat.subcategories.reduce((acc, s) => acc + s.real, 0))}</p>
                                        </div>
                                    </div>
                                </div>
                                <ul>
                                    {cat.subcategories.map((sub) => (
                                        <div
                                            className="flex flex-wrap my-2 items-center gap-x-4 justify-around md:justify-between"
                                            key={sub.id}>
                                            <div className="flex w-48 flex-wrap items-center gap-x-4 justify-start">
                                                <p className="text-c-red cursor-pointer hover:text-c-red/80"
                                                   onClick={() => {
                                                       setBudgetEntries((prevEntries) =>
                                                           prevEntries!.map((cat) => {
                                                               return {
                                                                   ...cat,
                                                                   subcategories: cat.subcategories.filter(
                                                                       s => s.id !== sub.id
                                                                   ),
                                                               };
                                                           }).filter((c) => c.subcategories.length > 0)
                                                       );
                                                   }}>&times;</p>
                                                <p>{itemSubcategories.find(s => s.id === sub.id)!.name}</p>
                                            </div>
                                            <div
                                                className="flex flex-wrap items-center gap-x-4 justify-around md:justify-between">
                                                <div
                                                    className="flex flex-wrap w-48 items-center gap-x-4 justify-between">
                                                    <p>Planned:</p>
                                                    <input
                                                        className="border-1 w-24 px-2 border-c-white/50 rounded"
                                                        type="text"
                                                        value={
                                                            editingPlanned[sub.id] !== undefined
                                                                ? editingPlanned[sub.id]
                                                                : formatMoney(sub.planned)
                                                        }
                                                        onChange={(e) => {
                                                            onChangePlanned(e, sub)
                                                        }}
                                                        onBlur={() => {
                                                            setEditingPlanned(prev => {
                                                                const newState = { ...prev };
                                                                delete newState[sub.id];
                                                                return newState;
                                                            });
                                                        }}/>
                                                </div>
                                                <div
                                                    className="flex flex-wrap w-48 items-center gap-x-4 justify-between">
                                                    <p>Real:</p>
                                                    <input
                                                        className="border-1 w-24 px-2 border-c-white/50 rounded"
                                                        type="text"
                                                        value={
                                                            editingReal[sub.id] !== undefined
                                                                ? editingReal[sub.id]
                                                                : formatMoney(sub.real)
                                                        }
                                                        onChange={(e) => {
                                                            onChangeReal(e, sub)
                                                        }}
                                                        onBlur={() => {
                                                            setEditingReal(prev => {
                                                                const newState = { ...prev };
                                                                delete newState[sub.id];
                                                                return newState;
                                                            });
                                                        }}/>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="flex flex-grow items-center justify-center">
                    <div
                        className="h-6 w-6 animate-spin rounded-full border-4 border-c-white border-t-transparent p-4"></div>
                </div>
            )}
        </div>
    );
}

