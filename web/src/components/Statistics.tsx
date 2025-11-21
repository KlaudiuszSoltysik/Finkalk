import React, { useEffect, useState } from "react";
import { type BudgetEntryNestedList, COLORS, type ItemCategory, type ItemSubcategory } from "../utils/Interfaces.ts";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import CustomLegend from "./CustomLegend.tsx";
import formatMoney from "../utils/formatMoney.ts";

interface Data {
    name: string;
    value: number;
    subcategories: (string | undefined)[];
    values: number[];
    advanced: boolean;
}

type ChartDataPoint = {
    name: string; planned: number; real: number;
};

interface Props {
    budgetEntries: BudgetEntryNestedList;
    itemCategories: ItemCategory[];
    itemSubcategories: ItemSubcategory[];
    advanced: boolean;
}

const Statistics: React.FC<Props> = ({ budgetEntries, itemCategories, itemSubcategories, advanced }) => {
    const [saldo, setSaldo] = useState<number>(0);
    const [totalPlanned, setTotalPlanned] = useState<number>(0);
    const [totalReal, setTotalReal] = useState<number>(0);
    const [pieDataPlanned, setPieDataPlanned] = useState<Data[] | null>(null);
    const [pieDataReal, setPieDataReal] = useState<Data[] | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null);

    useEffect(() => {
        if (budgetEntries == null) return;

        let saldo = 0
        let totalPlanned = 0;
        let totalReal = 0;

        for (const entry of budgetEntries) {
            if (entry.id !== itemCategories!.find(c => c.name === "Income")!.id) {
                for (const subcategory of entry.subcategories) {
                    totalPlanned += subcategory.planned;
                    totalReal += subcategory.real;
                }
            } else {
                for (const subcategory of entry.subcategories) {
                    saldo += subcategory.real;
                }
            }
        }

        setTotalPlanned(totalPlanned);
        setTotalReal(totalReal);
        setSaldo(saldo - totalReal)
    }, [budgetEntries, itemCategories]);

    useEffect(() => {
        if (budgetEntries == null) return;

        const piePlanned = budgetEntries
            .filter(n => n.id !== itemCategories!.find(c => c.name === "Income")!.id)
            .map(cat => {
                const subcategoryNames = cat.subcategories
                    .map(s => itemSubcategories.find(sub => sub.id === s.id)!.name)

                return {
                    name: itemCategories.find(c => c.id === cat.id)!.name,
                    value: cat.subcategories.reduce((sum, s) => sum + s.planned, 0),
                    subcategories: subcategoryNames,
                    values: cat.subcategories.map(s => s.planned),
                    advanced: advanced,
                };
            })
            .filter(p => p.value > 0);

        const pieReal = budgetEntries
            .filter(n => n.id !== itemCategories?.find(c => c.name === "Income")!.id)
            .map(cat => {
                const subcategoryNames = cat.subcategories
                    .map(s => itemSubcategories.find(sub => sub.id === s.id)!.name)

                return {
                    name: itemCategories.find(c => c.id === cat.id)!.name,
                    value: cat.subcategories.reduce((sum, s) => sum + s.real, 0),
                    subcategories: subcategoryNames,
                    values: cat.subcategories.map(s => s.real),
                    advanced: advanced,
                };
            })
            .filter(p => p.value > 0);

        setPieDataPlanned(piePlanned);
        setPieDataReal(pieReal);
    }, [advanced, budgetEntries, itemCategories, itemSubcategories]);

    useEffect(() => {
        if (budgetEntries == null) return;

        const chartData: ChartDataPoint[] = budgetEntries.filter(n => n.id !== itemCategories.find(c => c.name === "Income")!.id).map(entry => {
            return ({
                name: itemCategories.find(c => c.id === entry.id)!.name,
                planned: entry.subcategories.reduce((sum, sub) => sum + sub.planned, 0),
                real: entry.subcategories.reduce((sum, sub) => sum + sub.real, 0),
            });
        });

        const safeChartData = chartData.length === 1
            ? [...chartData, { name: '', planned: 0, real: 0 }]
            : chartData;

        setChartData(safeChartData);
    }, [budgetEntries, itemCategories]);

    return (
        <>
            <div className="bg-c-black/50 my-2 px-4 py-2 rounded-xl flex flex-wrap items-center justify-around">
                <p className="text-xl font-bold">Money summary</p>
                <div className="flex flex-wrap items-center justify-around gap-x-8">
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                        <p>Saldo:</p>
                        <p>{formatMoney(saldo)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                        <p>Planned spending's:</p>
                        <p>{formatMoney(totalPlanned)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                        <p>Real spending's:</p>
                        <p>{formatMoney(totalReal)}</p>
                    </div>
                </div>
            </div>
            {pieDataPlanned && pieDataReal && chartData && (
                <div className="bg-c-black/50 my-2 px-4 py-2 rounded-xl">
                    <div className="flex flex-col flex-wrap items-center justify-around gap-x-4">
                        <div className="flex w-full flex-wrap items-center justify-around gap-x-4">
                            <PieChart width={250} height={250}>
                                <Pie
                                    data={pieDataPlanned!}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {pieDataPlanned.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                                    ))}
                                </Pie>
                            </PieChart>
                            <PieChart width={250} height={250}>
                                <Pie
                                    data={pieDataReal!}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {pieDataReal.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                                    ))}
                                </Pie>
                            </PieChart>
                        </div>
                        <div className="flex w-full flex-wrap items-top justify-around gap-x-4">
                            <CustomLegend payload={pieDataPlanned.map((entry, index) => ({
                                color: COLORS[index % COLORS.length],
                                payload: entry
                            }))}/>
                            <CustomLegend payload={pieDataReal.map((entry, index) => ({
                                color: COLORS[index % COLORS.length],
                                payload: entry
                            }))}/>
                        </div>
                    </div>
                    <div>
                        <ResponsiveContainer width="100%" height={(chartData.length + 1) * 60}>
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis type="number"/>
                                <YAxis type="category" dataKey="name" interval={0}/>
                                <Legend/>
                                <Bar dataKey="planned" fill={COLORS[0]} name="Planned"/>
                                <Bar dataKey="real" fill={COLORS[1]} name="Real"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </>
    );
};

export default Statistics;
