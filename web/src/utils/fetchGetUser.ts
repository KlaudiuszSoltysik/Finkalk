import type {User} from "./Interfaces.ts";

export default async function fetchGetUser(backendUrl:string) {
    try {
        const response = await fetch(`${backendUrl}/user/get-user`, {
            credentials: 'include',
            method: 'GET',
        });

        if (!response.ok) return null;

        const user: User = await response.json();
        return user;
    } catch {
        return null;
    }
}

