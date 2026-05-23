import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

   useEffect(() => {
    try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser || storedUser === "undefined") return;

        setUser(JSON.parse(storedUser));

    } catch (err) {
        console.log("Invalid user in localStorage");
        localStorage.removeItem("user");
    }
}, []);

    const login = (data) => {

        localStorage.setItem("token", data.token);

        const userData = {
            userId: data.userId,
            name: data.name,
            role: data.role
        };

        localStorage.setItem("user", JSON.stringify(userData));

        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("email");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ login, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;