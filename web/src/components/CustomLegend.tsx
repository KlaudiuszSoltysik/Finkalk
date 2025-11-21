import React from "react";
import type {LegendProps} from "recharts";
import formatMoney from "../utils/formatMoney.ts";

type Props = LegendProps & {
    payload: any;
};

const CustomLegend: React.FC<Props> = ({payload}) => {
    if (!payload || !payload.length) return null;

    return (
        <div>
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                {payload.map((entry: any, index: number) => {
                    const itemCategory = entry.payload;
                    const color = entry.color;

                    if (entry.payload.advanced) {
                        return (
                            <div key={index}>
                                <div className="flex w-48 justify-between">
                                    <p style={{ color }}>{itemCategory.name}:</p>
                                    <p style={{ color }}>{formatMoney(itemCategory.value)}</p>
                                </div>
                                <>
                                    {itemCategory.subcategories.map((sub: string, i: number) => (
                                        <div key={i} className="flex w-48 text-sm justify-between">
                                            <p style={{ color }}>- {sub}</p>
                                            <p style={{ color }}>{formatMoney(itemCategory.values[i])}</p>
                                        </div>
                                    ))}
                                </>
                            </div>
                        );
                    } else {
                        return (
                            <div key={index} className="flex w-48 justify-between">
                                <p style={{ color }}>{itemCategory.name}</p>
                                <p style={{ color }}>{formatMoney(itemCategory.value)}</p>
                            </div>
                        );
                    }
                })}
            </ul>
        </div>
    );
}

export default CustomLegend;