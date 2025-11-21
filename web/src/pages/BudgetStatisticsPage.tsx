import { useEffect, useState } from "react";
import fetchGetUser from "../utils/fetchGetUser.ts";
import {
    backendUrl,
    type BudgetEntry,
    type BudgetEntryNestedList,
    type BudgetEntrySubcategory,
    type CategoryMap,
    COLORS,
    type ItemCategory,
    type ItemSubcategory,
    type MonthlyBudget,
    type User
} from "../utils/Interfaces.ts";
import fetchCheckLogin from "../utils/fetchCheckLogin.ts";
import Navbar from "../components/Navbar.tsx";
import MonthSelector from "../components/MonthSelector.tsx";
import Statistics from "../components/Statistics.tsx";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import fetchGetCategories from "../utils/fetchGetCategories.ts";
import fetchGetSubcategories from "../utils/fetchGetSubcategories.ts";
import { useNavigate } from "react-router-dom";
import formatMoney from "../utils/formatMoney.ts";

type DataPoint = {
    name: string;
    catAnimals: number | null;
    catChemicals: number | null;
    catClothing: number | null;
    catEducation: number | null;
    catEntertainment: number | null;
    catFood: number | null;
    catGifts: number | null;
    catHealth: number | null;
    catHome: number | null;
    catIncome: number | null;
    catKids: number | null;
    catLoans: number | null;
    catSavings: number | null;
    catSubscriptions: number | null;
    catTechnology: number | null;
    catTransportation: number | null;
};

const legendItems = [{ key: 'catAnimals', label: 'Animals', color: COLORS[0] }, {
    key: 'catChemicals',
    label: 'Chemicals',
    color: COLORS[1]
}, { key: 'catClothing', label: 'Clothing', color: COLORS[2] }, {
    key: 'catEducation',
    label: 'Education',
    color: COLORS[3]
}, { key: 'catEntertainment', label: 'Entertainment', color: COLORS[4] }, {
    key: 'catFood',
    label: 'Food',
    color: COLORS[5]
}, { key: 'catGifts', label: 'Gifts', color: COLORS[6] }, {
    key: 'catHealth',
    label: 'Health',
    color: COLORS[7]
}, { key: 'catHome', label: 'Home', color: COLORS[8] }, {
    key: 'catIncome',
    label: 'Income',
    color: COLORS[9]
}, { key: 'catKids', label: 'Kids', color: COLORS[10] }, {
    key: 'catLoans',
    label: 'Loans',
    color: COLORS[11]
}, { key: 'catSavings', label: 'Savings', color: COLORS[12] }, {
    key: 'catSubscriptions',
    label: 'Subscriptions',
    color: COLORS[13]
}, { key: 'catTechnology', label: 'Technology', color: COLORS[14] }, {
    key: 'catTransportation',
    label: 'Transportation',
    color: COLORS[15]
}];

export default function BudgetStatisticsPage() {
    const date = new Date();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [itemCategories, setItemCategories] = useState<ItemCategory[] | null>(null);
    const [itemSubcategories, setItemSubcategories] = useState<ItemSubcategory[] | null>(null);
    const [budgetEntries, setBudgetEntries] = useState<BudgetEntryNestedList | null>(null);
    const [startMonth, setStartMonth] = useState<number>(date.getMonth());
    const [startYear, setStartYear] = useState<number>(date.getFullYear() - 1);
    const [endMonth, setEndMonth] = useState<number>(date.getMonth());
    const [endYear, setEndYear] = useState<number>(date.getFullYear());
    const [chartData, setChartData] = useState<DataPoint[] | null>(null);
    const [socialStats, setSocialStats] = useState<Record<number, number> | null>(null);
    const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
        catAnimals: true,
        catChemicals: true,
        catClothing: true,
        catEducation: true,
        catEntertainment: true,
        catFood: true,
        catGifts: true,
        catHealth: true,
        catHome: true,
        catIncome: true,
        catKids: true,
        catLoans: true,
        catSavings: true,
        catSubscriptions: true,
        catTechnology: true,
        catTransportation: true
    });

    useEffect(() => {
        const fetchUser = async () => {
            const isLogged = await fetchCheckLogin(backendUrl);

            if (!isLogged) navigate('/login', { state: { endpoint: 'budget-statistics' } })

            const user = await fetchGetUser(backendUrl);

            if (user == null) navigate('/login', { state: { endpoint: 'budget-statistics' } })

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
            getBudgets();
            getSocialStats()
        }, 750);

        return () => clearTimeout(handler);
    }, [startMonth, startYear, endMonth, endYear, itemCategories, itemSubcategories]);

    const getBudgets = async () => {
        const fetchBudgets = async () => {
            try {
                const response = await fetch(`${backendUrl}/budget/get-history?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`, {
                    credentials: 'include', method: 'GET',
                });

                if (!response.ok) return null;

                const budgetResponse: MonthlyBudget[] = await response.json();
                return budgetResponse;
            } catch {
                return null;
            }
        };

        const rawResponse = await fetchBudgets();

        if (rawResponse == null) return;

        for (const budget of rawResponse) {
            for (const entry of budget.entries) {
                entry.itemCategoryId = itemSubcategories!.find(s => s.id === entry.itemSubcategoryId)!.itemCategoryId;
            }
        }

        const data: DataPoint[] = []

        for (const budget of rawResponse) {
            const getReal = (categoryName: string) => {
                const catId = itemCategories!.find(c => c.name === categoryName)?.id;
                if (catId == null) return 0;

                return budget.entries
                    .filter(e => e.itemCategoryId === catId)
                    .reduce((sum, e) => sum + e.real, 0);
            };

            data.push({
                name: `${budget.month + 1}.${budget.year}`,
                catAnimals: getReal("Animals"),
                catChemicals: getReal("Chemicals"),
                catClothing: getReal("Clothing"),
                catEducation: getReal("Education"),
                catEntertainment: getReal("Entertainment"),
                catFood: getReal("Food"),
                catGifts: getReal("Gifts"),
                catHealth: getReal("Health"),
                catHome: getReal("Home"),
                catIncome: getReal("Income"),
                catKids: getReal("Kids"),
                catLoans: getReal("Loans"),
                catSavings: getReal("Savings"),
                catSubscriptions: getReal("Subscriptions"),
                catTechnology: getReal("Technology"),
                catTransportation: getReal("Transportation"),
            });
        }

        setChartData(data);

        const allEntries = rawResponse.flatMap(b => b.entries);

        const merged: BudgetEntry[] = [];

        const seen = new Map<number, BudgetEntry>();

        for (const entry of allEntries) {
            const { itemCategoryId, itemSubcategoryId, planned, real } = entry;

            if (!seen.has(itemSubcategoryId)) {
                const sub = itemSubcategories!.find(s => s.id === itemSubcategoryId);
                if (!sub) throw new Error(`Subcategory ${itemSubcategoryId} not found`);

                const newEntry: BudgetEntry = {
                    itemCategoryId: itemCategoryId, itemSubcategoryId, planned, real
                };

                seen.set(itemSubcategoryId, newEntry);
                merged.push(newEntry);
            } else {
                const existing = seen.get(itemSubcategoryId)!;
                existing.planned += planned;
                existing.real += real;
            }
        }

        const grouped = merged.reduce((acc, entry) => {
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
                        id: Number(subcategoryIdStr), ...(values as { planned: number; real: number })
                    }))
                    .sort((a, b) => b.planned - a.planned);

                return {
                    id: Number(categoryIdStr), subcategories: subcategoryList
                };
            });

        const sortedCategoryList = categoryList.sort((a, b) => {
            const totalA = a.subcategories.reduce((sum, sub) => sum + sub.planned, 0);
            const totalB = b.subcategories.reduce((sum, sub) => sum + sub.planned, 0);
            return totalB - totalA;
        });

        setBudgetEntries(sortedCategoryList);
    };

    const getSocialStats = async () => {
        const fetchSocialStats = async () => {
            try {
                const response = await fetch(`${backendUrl}/budget/get-social-stats?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`, {
                    credentials: 'include', method: 'GET',
                });

                if (!response.ok) return null;

                return await response.json();
            } catch {
                return null;
            }
        };

        const rawResponse = await fetchSocialStats();

        if (rawResponse == null) return;

        setSocialStats(rawResponse)
    };

    return (
        <div className="flex min-h-screen flex-col bg-c-primary text-c-white font-poppins">
            {user && <Navbar user={user} path="budget-statistics"/>}
            <div className="w-5/6 lg:w-4/6 mx-auto py-8">
                <div className="flex flex-wrap justify-around items-center">
                    <div>
                        <p className="text-sm">Start date</p>
                        <MonthSelector month={startMonth} setMonth={setStartMonth} year={startYear}
                                       setYear={setStartYear} date={date}/>
                    </div>
                    <div>
                        <p className="text-sm">End date</p>
                        <MonthSelector month={endMonth} setMonth={setEndMonth} year={endYear} setYear={setEndYear}
                                       date={date}/>
                    </div>
                </div>
                {itemCategories && socialStats ? (
                    <div className="bg-c-black/50 my-2 px-4 py-2 rounded-xl">
                        <p className="text-xl font-bold">Median spending for people similar to you by category</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 my-2 gap-x-4 gap-y-1">
                            {itemCategories.map(cat => (
                                socialStats[cat.id] && (
                                    <div key={cat.id} className="flex justify-between">
                                        <span>{cat.name}:</span>
                                        <span>{formatMoney(socialStats[cat.id])}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex p-8 items-center justify-center">
                        <div
                            className="h-6 w-6 animate-spin rounded-full border-4 border-c-white border-t-transparent p-4"></div>
                    </div>
                )}
                {itemCategories && itemSubcategories && budgetEntries && chartData ? (
                    <>
                        <Statistics
                            budgetEntries={budgetEntries} itemCategories={itemCategories}
                            itemSubcategories={itemSubcategories}
                            advanced={true}/>
                        <div className="bg-c-black/50 px-4 py-4 rounded-xl">
                            <div className="w-full max-w-[1000px] h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3"/>
                                        <XAxis dataKey="name"/>
                                        <YAxis/>
                                        {visibleLines.catAnimals &&
                                            <Line name="Animals" dataKey="catAnimals" stroke="#077a7d"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catChemicals &&
                                            <Line name="Chemicals" dataKey="catChemicals" stroke="#564d80"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catClothing &&
                                            <Line name="Clothing" dataKey="catClothing" stroke="#0CCE6B"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catEducation &&
                                            <Line name="Education" dataKey="catEducation" stroke="#ff9800"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catEntertainment &&
                                            <Line name="Entertainment" dataKey="catEntertainment" stroke="#d81e5b"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catFood &&
                                            <Line name="Food" dataKey="catFood" stroke="#1f77b4" strokeWidth={1}/>}
                                        {visibleLines.catGifts &&
                                            <Line name="Gifts" dataKey="catGifts" stroke="#ff7f0e"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catHealth &&
                                            <Line name="Health" dataKey="catHealth" stroke="#2ca02c"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catHome &&
                                            <Line name="Home" dataKey="catHome" stroke="#d62728" strokeWidth={1}/>}
                                        {visibleLines.catIncome &&
                                            <Line name="Income" dataKey="catIncome" stroke="#9467bd"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catKids &&
                                            <Line name="Kids" dataKey="catKids" stroke="#8c564b" strokeWidth={1}/>}
                                        {visibleLines.catLoans &&
                                            <Line name="Loans" dataKey="catLoans" stroke="#e377c2"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catSavings &&
                                            <Line name="Savings" dataKey="catSavings" stroke="#7f7f7f"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catSubscriptions &&
                                            <Line name="Subscriptions" dataKey="catSubscriptions" stroke="#bcbd22"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catTechnology &&
                                            <Line name="Technology" dataKey="catTechnology" stroke="#17becf"
                                                  strokeWidth={1}/>}
                                        {visibleLines.catTransportation &&
                                            <Line name="Transportation" dataKey="catTransportation" stroke="#005f73"
                                                  strokeWidth={1}/>}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-y-2 gap-x-4 justify-center">
                                {legendItems.map(({ key, label, color }) => (
                                    <div
                                        key={key}
                                        className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none  border rounded text-sm transition-opacity ${
                                            visibleLines[key] ? 'opacity-100' : 'opacity-50'
                                        }`}
                                        onClick={() => setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }))}>
                                        <span className="h-1 w-4 rounded" style={{ backgroundColor: color }}/>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-grow items-center justify-center">
                        <div
                            className="h-6 w-6 animate-spin rounded-full border-4 border-c-white border-t-transparent p-4"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
