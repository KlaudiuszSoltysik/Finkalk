import { useLocation } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton.tsx";

export default function LoginPage() {
    const location = useLocation();
    const endpoint = location.state?.endpoint;

    return (
        <div className="flex min-h-screen flex-col bg-c-primary h-screen w-screen items-center justify-center text-c-white font-poppins">
            <GoogleLoginButton endpoint={endpoint}/>
        </div>
    );
}

