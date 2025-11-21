import React from "react";
import { backendUrl, type User } from "../utils/Interfaces.ts";
import { useNavigate } from 'react-router-dom';

interface Props {
    user: User;
    path: string
}

const Navbar: React.FC<Props> = ({ user, path }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch(`${backendUrl}/user/logout`, {
                credentials: 'include',
                method: 'GET',
            });

            if (response.ok) {
                window.location.reload();
            } else {
                return null
            }
        } catch {
            return null
        }
    }

    return (
        <nav className="flex gap-y-2 flex-wrap items-center cursor-default justify-between gap-x-4 p-2 bg-c-black/50">
            <div className="text-4xl font-bold">
                Finkalk
            </div>
            <div className="flex flex-wrap items-center gap-x-4 justify-between">
                <p className={`cursor-pointer hover:text-c-white/80 ${path === "" ? "text-c-green/80" : ""}`} onClick={() => navigate('/')}>Budget</p>
                <p className={`cursor-pointer hover:text-c-white/80 ${path === "transactions" ? "text-c-green/80" : ""}`}
                   onClick={() => navigate('/transactions')}>Transactions</p>
                <p className={`cursor-pointer hover:text-c-white/80 ${path === "budget-statistics" ? "text-c-green/80" : ""}`}
                   onClick={() => navigate('/budget-statistics')}>Statistics</p>
                <p className="cursor-pointer hover:text-c-white/80">Investments</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 justify-between">
                {user.pictureUrl && (
                    <img
                        className="rounded-full h-12 w-12"
                        src={user.pictureUrl}
                        alt="User"
                    />
                )}
                <span>{user.name}</span>
                <button
                    className="bg-c-red cursor-pointer hover:bg-c-red/80 py-2 px-4 rounded mx-4"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
