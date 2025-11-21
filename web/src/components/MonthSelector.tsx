import React from "react";

interface Props {
    month: number;
    setMonth: React.Dispatch<React.SetStateAction<number>>;
    year: number;
    setYear: React.Dispatch<React.SetStateAction<number>>;
    date: Date;
}

const MonthSelector: React.FC<Props> = ({ month, setMonth, year, setYear, date }) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleLeftArrowClick = () => {
        if (month == 0) {
            setMonth(11);
            setYear(prevState => prevState - 1);
        } else {
            setMonth(prevState => prevState - 1);
        }
    };

    const handleRightArrowClick = () => {
        if (date.getMonth() + 1 === month && date.getFullYear() === year) {
            return
        }

        if (month == 11) {
            setMonth(0);
            setYear(prevState => prevState + 1);
        } else {
            setMonth(prevState => prevState + 1);
        }
    };

    return (
        <div className="text-xl w-72 font-bold flex m-4 items-center justify-between gap-x-4">
            <span className="cursor-pointer select-none"
                onClick={handleLeftArrowClick}
            >
            &lt;
            </span>
            <p className="cursor-default">
                {monthNames[month]} {year}
            </p>
            <span className={`cursor-pointer select-none ${date.getMonth() + 1 === month && date.getFullYear() === year ? "invisible" : ""}`}
                onClick={handleRightArrowClick}
            >
                &gt;
                </span>
        </div>
    );
};

export default MonthSelector;
