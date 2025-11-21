import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import BudgetCreatorPage from "./pages/BudgetCreatorPage.tsx";
import BudgetStatisticsPage from "./pages/BudgetStatisticsPage.tsx";
import TransactionsPage from "./pages/TransactionsPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/" element={<BudgetCreatorPage/>}/>
                <Route path="/transactions" element={<TransactionsPage/>}/>
                <Route path="/budget-statistics" element={<BudgetStatisticsPage/>}/>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
