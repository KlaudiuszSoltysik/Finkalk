import React, { useState } from "react";
import { backendUrl, type ItemCategory, type ItemSubcategory } from "../utils/Interfaces.ts";

type TransactionFull = {
    shopName?: string;
    category: number,
    subcategory: number,
    source: string;
    total: string;
    timestamp: string;
    note?: string;
};

export type TransactionSend = {
    shopName?: string; itemSubcategoryId: number, source: string; total: number; timestamp: Date; note?: string;
};

const defaultTransaction: TransactionFull = {
    shopName: "", category: 1, subcategory: 1, source: "", total: "", timestamp: new Date().toLocaleString('sv-SE', {
        timeZoneName: 'short'
    }).slice(0, 16).replace(' ', 'T'), note: "",
};

type Props = {
    categories: ItemCategory[];
    subcategories: ItemSubcategory[],
    getTransactions: () => Promise<void>;
};

const TransactionForm: React.FC<Props> = ({ categories, subcategories, getTransactions }) => {
    const [formData, setFormData] = useState<TransactionFull>(defaultTransaction);
    const [showNotification, setShowNotification] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [matchingShops, setMatchingShops] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const parseTransactionToRequestBody = (tx: TransactionFull): TransactionSend => {
        const parsedTotal = parseFloat(tx.total.replace(",", "."));

        if (isNaN(parsedTotal) || parsedTotal < 0) {
            throw new Error(`Invalid total value: ${tx.total}`);
        }

        const parsedTimestamp = new Date(tx.timestamp);
        if (isNaN(parsedTimestamp.getTime())) {
            throw new Error(`Invalid timestamp: ${tx.timestamp}`);
        }

        return {
            shopName: tx.shopName,
            itemSubcategoryId: tx.subcategory,
            source: tx.source,
            total: parseFloat(parsedTotal.toFixed(2)),
            timestamp: parsedTimestamp,
            note: tx.note
        };
    }

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name === "shopName") {
            await getMatchingShops(value)
        }

        if (name === "total") {
            const input = value.replace(",", ".");

            const floatRegex = /^([1-9]\d*)(\.\d{0,2})?$/;

            if (input === "" || floatRegex.test(input)) {
                if (input.startsWith("-")) return;

                setFormData((prev) => ({ ...prev, [name]: input }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.total === "") {
            return
        }

        setIsPending(true);

        try {
            const requestBody = parseTransactionToRequestBody(formData);

            await fetch(`${backendUrl}/transaction/save-transaction`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            setFormData(defaultTransaction)
            getTransactions()

            notify();
        } catch {
            return null;
        }

        setIsPending(false);
    };

    const getMatchingShops = async (value: string) => {
        if (value.length < 2) return

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
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev > 0 ? prev - 1 : matchingShops.length - 1
            );
        }
        else if (e.key === "Enter") {
            if (highlightedIndex >= 0) {
                setFormData(prev => ({ ...prev, shopName: matchingShops[highlightedIndex] }));
                setMatchingShops([]);
            }
        }
    };

    const notify = () => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    return (
        <div className="my-2">
            <form className="grid md:grid-cols-2 grid-cols-1 gap-x-4 gap-y-2" onSubmit={handleSubmit}>
                <div className="flex gap-x-2 justify-between">
                    <label>Shop name:</label>
                    <div className="relative w-48">
                        <input
                            className="border-1 w-full px-2 border-c-white/50 rounded"
                            type="text"
                            autoComplete="off"
                            name="shopName"
                            value={formData.shopName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                        />
                        {matchingShops.length > 0 && (
                            <ul className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-c-white/50 bg-c-primary">
                                {matchingShops.map((shop, index) => (
                                    <li
                                        key={index}
                                        className={`cursor-pointer px-2 py-1 ${
                                            index === highlightedIndex ? "bg-c-green" : "bg-c-primary"
                                        }`}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, shopName: shop }));
                                            setMatchingShops([]);
                                        }}
                                    >
                                        {shop}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="flex gap-x-2 justify-between">
                    <label>Category:</label>
                    <select
                        className="border-1 w-48 px-2 border-c-white/50 rounded "
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                    >
                        {categories.map((category) => (
                            <option className="bg-c-primary" key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-x-2 justify-between">
                    <label>Subcategory:</label>
                    <select
                        className="border-1 w-48 px-2 border-c-white/50 rounded "
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                    >
                        {subcategories
                            .filter((s) => s.itemCategoryId == formData.category)
                            .map((subcategory) => (
                                <option className="bg-c-primary" key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="flex gap-x-2 justify-between">
                    <label>Total:</label>
                    <input
                        className={`border-1 w-48 px-2  rounded ${formData.total === ""
                            ? "border-c-red/50"
                            : "border-c-green/50"}`}
                        type="text"
                        autoComplete="off"
                        name="total"
                        value={formData.total}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="flex gap-x-2 justify-between">
                    <label>Timestamp:</label>
                    <input
                        className="border-1 w-48 px-2 border-c-white/50 rounded"
                        type="datetime-local"
                        name="timestamp"
                        value={formData.timestamp}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex gap-x-2 justify-between">
                    <label>Source:</label>
                    <select
                        className="border-1 w-48 px-2 border-c-white/50 rounded "
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                    >
                        <option className="bg-c-primary" value="">Not specified</option>
                        <option className="bg-c-primary" value="online">Online</option>
                        <option className="bg-c-primary" value="stationary">Stationary</option>
                    </select>
                </div>

                <div className="flex justify-between md:col-span-2 gap-x-2">
                    <label>Note:</label>
                    <input
                        className="border-1 w-48 md:w-full px-2 border-c-white/50 rounded"
                        name="note"
                        autoComplete="off"
                        value={formData.note}
                        onChange={handleChange}
                        maxLength={300}
                    />
                </div>
            </form>
            <div className="flex justify-center m-4">
                {isPending ? (
                    <div></div>
                ) : (
                    <button
                        className={`border-2 px-8 py-1 rounded  
                            ${formData.total === ""
                            ? "border-gray-400 text-gray-400 cursor-not-allowed"
                            : "border-c-green cursor-pointer hover:border-c-green/80"}`}
                        type="submit"
                        disabled={formData.total === ""}
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                )}
            </div>
            {showNotification && (
                <div
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 px-6 py-3 opacity-90 border-c-green bg-c-primary-dark text-c-white z-[9999]">
                    Purchase saved!
                </div>
            )}
        </div>
    );
};

export default TransactionForm;
