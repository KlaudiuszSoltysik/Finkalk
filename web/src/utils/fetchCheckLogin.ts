export default async function fetchCheckLogin(backendUrl:string) {
    try {
        const response = await fetch(`${backendUrl}/user/check-login`, {
            credentials: 'include',
            method: 'GET',
        });

        return response.json();
    } catch {
        return false;
    }
}

