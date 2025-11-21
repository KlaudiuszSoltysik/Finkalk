import React, { useEffect, useState } from "react";
import fetchGetUser from "../utils/fetchGetUser.ts";
import { backendUrl, type ItemCategory, type ItemSubcategory, type User } from "../utils/Interfaces.ts";
import fetchCheckLogin from "../utils/fetchCheckLogin.ts";
import Navbar from "../components/Navbar.tsx";
import fetchGetCategories from "../utils/fetchGetCategories.ts";
import fetchGetSubcategories from "../utils/fetchGetSubcategories.ts";
import MonthSelector from "../components/MonthSelector.tsx";
import TransactionForm from "../components/TransactionForm.tsx";
import { useNavigate } from "react-router-dom";
import formatMoney from "../utils/formatMoney.ts";

type Transaction = {
    id: number,
    shopName?: string;
    itemSubcategoryId: number,
    source: string;
    total: number;
    timestamp: Date;
    note?: string;
};

type Filters = {
    shopName?: string; category?: number, subcategory?: number, source?: string; note?: string;
};

type FiltersPost = {
    shopName?: string; itemSubcategoryId?: number, source?: string; note?: string;
};

export default function TransactionsPage() {
    const date = new Date();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [itemCategories, setItemCategories] = useState<ItemCategory[] | null>(null);
    const [itemSubcategories, setItemSubcategories] = useState<ItemSubcategory[] | null>(null);
    const [month, setMonth] = useState<number>(date.getMonth());
    const [year, setYear] = useState<number>(date.getFullYear());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [sort, setSort] = useState("timestamp");
    const [matchingShops, setMatchingShops] = useState<string[]>([]);
    const [filters, setFilters] = useState<Filters>({});
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    useEffect(() => {
        const fetchUser = async () => {
            const isLogged = await fetchCheckLogin(backendUrl);

            if (!isLogged) navigate('/login', { state: { endpoint: 'transactions' } })

            const user = await fetchGetUser(backendUrl);

            if (user == null) navigate('/login', { state: { endpoint: 'transactions' } })

            setUser(user);
        };

        fetchUser()
    }, [backendUrl, navigate]);

    useEffect(() => {
        const fun = async () => {
            return setItemCategories(await fetchGetCategories(backendUrl))
        }

        fun()
    }, [backendUrl]);

    useEffect(() => {
        const fun = async () => {
            return setItemSubcategories(await fetchGetSubcategories(backendUrl))
        }

        fun()
    }, [backendUrl]);

    useEffect(() => {
        if (itemCategories == null || itemSubcategories == null) return;

        const handler = setTimeout(() => {
            getTransactions();
        }, 750);

        return () => clearTimeout(handler);

    }, [month, year, itemCategories, itemSubcategories, sort, filters]);

    const getTransactions = async () => {
        const fetchTransactions = async () => {
            const Filters: FiltersPost = {
                shopName: filters.shopName,
                itemSubcategoryId: filters.subcategory,
                source: filters.source,
                note: filters.note
            };

            try {
                const response = await fetch(`${backendUrl}/transaction/get-transactions`, {
                    credentials: 'include', method: 'POST', headers: {
                        'Content-Type': 'application/json'
                    }, body: JSON.stringify({ month, year, sort, Filters })
                });

                if (!response.ok) return null;

                return await response.json();
            } catch {
                return null;
            }
        };

        const rawResponse = await fetchTransactions();

        if (rawResponse == null) return;

        setTransactions(rawResponse);
    };

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name === "shopName") {
            await getMatchingShops(value)
        } else if (name === "category") {
            setFilters(prev => ({ ...prev, ["subcategory"]: 999 }));
        }

        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const getMatchingShops = async (value: string) => {
        try {
            const response = await fetch(`${backendUrl}/transaction/filter-shops?name=${encodeURIComponent(value)}`, {
                credentials: 'include',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            setMatchingShops(await response.json());
        } catch {
            return null;
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (matchingShops.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < matchingShops.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev > 0 ? prev - 1 : matchingShops.length - 1
            );
        } else if (e.key === "Enter") {
            if (highlightedIndex >= 0) {
                setFilters((prev) => ({ ...prev, shopName: matchingShops[highlightedIndex] }));
                setMatchingShops([]);
            }
        }
    };

    const deleteTransaction = async (id: number) => {
        try {
            const response = await fetch(`${backendUrl}/transaction/delete-transaction`, {
                credentials: 'include', method: 'DELETE', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify(id)
            });

            if (!response.ok) return null;

            await getTransactions()

            return await response.json();
        } catch {
            return null;
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-c-primary text-c-white font-poppins">
            {user && <Navbar user={user} path="transactions"/>}
            {itemCategories && itemSubcategories ? (
                <div className="w-5/6 lg:w-4/6 mx-auto py-4">
                    <div className="flex justify-center">
                        <MonthSelector month={month} setMonth={setMonth} year={year} setYear={setYear} date={date}/>
                    </div>
                    <div className="bg-c-black/50 my-2 px-4 py-2 rounded-xl">
                        <p className="text-xl font-bold">Add transaction</p>
                        <TransactionForm categories={itemCategories} subcategories={itemSubcategories}
                                         getTransactions={getTransactions}/>
                    </div>
                    <div
                        className="bg-c-black/50 my-2 px-4 py-2 rounded-xl flex justify-around flex-wrap gap-x-4 gap-y-2">
                        <div className="relative w-48">
                            <input
                                placeholder="Shop"
                                className="border-1 px-2 w-48 border-c-white/50 rounded"
                                type="text"
                                autoComplete="off"
                                name="shopName"
                                value={filters.shopName ?? ""}
                                onChange={handleChange}
                                onFocus={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                            {matchingShops.length > 0 && (
                                <ul className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-c-white/50 bg-c-primary">
                                    {matchingShops.map((shop, index) => (
                                        <li
                                            className={`cursor-pointer px-2 py-1 ${
                                                index === highlightedIndex ? "bg-c-green" : "bg-c-primary"
                                            }`}
                                            key={index}
                                            onClick={() => {
                                                setFilters(prev => ({ ...prev, shopName: shop }));
                                                setMatchingShops([]);
                                            }}>
                                            {shop}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <select
                            className="border-1 w-48 px-2 border-c-white/50 rounded "
                            value={filters.category}
                            name="category"
                            onChange={handleChange}>
                            <option className="bg-c-primary" value={999}>Category</option>
                            {itemCategories.map((category) => (
                                <option className="bg-c-primary" key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border-1 w-48 px-2 border-c-white/50 rounded "
                            value={filters.subcategory}
                            name="subcategory"
                            onChange={handleChange}>
                            <option className="bg-c-primary" value={999}>Subcategory</option>
                            {itemSubcategories.filter(s => s.itemCategoryId == filters.category).map((subcategory) => (
                                <option className="bg-c-primary" key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border-1 w-48 px-2 border-c-white/50 rounded "
                            value={filters.source}
                            name="source"
                            onChange={handleChange}>
                            <option className="bg-c-primary" value="">Source</option>
                            <option className="bg-c-primary" value="online">Online</option>
                            <option className="bg-c-primary" value="stationary">Stationary</option>
                        </select>
                        <input
                            className="border-1 w-96 px-2 border-c-white/50 rounded"
                            type="text"
                            name="note"
                            autoComplete="off"
                            placeholder="Note"
                            value={filters.note}
                            onChange={handleChange}/>
                        <div className="flex gap-2">
                            <span>Sort by:</span>
                            <span>Timestamp</span>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    className="sr-only peer"
                                    type="checkbox"
                                    checked={sort !== "timestamp"}
                                    onChange={(e) => setSort(e.target.checked ? "total" : "timestamp")}
                                />
                                <div
                                    className="h-6 w-11 rounded-full peer-focus:outline-none peer-focus:ring-2 transition-all duration-200 bg-c-secondary peer peer-checked:bg-c-tetriary"></div>
                                <div
                                    className="absolute top-1 left-1 h-4 w-4 peer-checked:translate-x-5 transform rounded-full transition-transform duration-200 bg-c-primary-dark"></div>
                            </label>
                            <span>Total</span>
                        </div>
                    </div>
                    {transactions.map((transaction) => (
                        <div
                            className="bg-c-black/50 my-2 px-4 py-2 rounded-xl grid md:grid-cols-3 grid-cols-1 gap-x-4 gap-y-2"
                            key={transaction.id}>
                            <div className="flex md:col-span-2 gap-x-2">
                                <p className="text-c-red cursor-pointer hover:text-c-red/80"
                                   onClick={() => deleteTransaction(transaction.id)}>
                                    &times;</p>
                                <span>Date:</span>
                                <span>
                                    {new Date(transaction.timestamp).toLocaleString('pl-PL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                    })}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Shop:</span>
                                <span>{transaction.shopName}</span>
                            </div>

                            {(() => {
                                const subcategory = itemSubcategories.find((s) => s.id === transaction.itemSubcategoryId);
                                const category = itemCategories.find((c) => c.id === subcategory?.itemCategoryId);
                                return (
                                    <div className="flex justify-between">
                                        <span>Category: </span>
                                        <span>{category?.name}</span>
                                    </div>
                                );
                            })()}

                            {(() => {
                                const subcategory = itemSubcategories.find((s) => s.id === transaction.itemSubcategoryId);
                                return (
                                    <div className="flex justify-between">
                                        <span>Subcategory: </span>
                                        <span>{subcategory?.name}</span>
                                    </div>
                                );
                            })()}

                            <div className="flex justify-between">
                                <span>Source:</span>
                                <span>{transaction.source}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Total:</span>
                                <span>{formatMoney(transaction.total)}</span>
                            </div>

                            <div className="md:col-span-2">
                                <span>Note: </span>
                                <span>{transaction.note}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex p-8 items-center justify-center">
                    <div
                        className="h-6 w-6 animate-spin rounded-full border-4 border-c-white border-t-transparent p-4"></div>
                </div>
            )}
        </div>);
}

