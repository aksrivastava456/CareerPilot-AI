import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../utils/auth.js";
import "./Login.css";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    useEffect(() => {
        if (getValidToken()) {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    function handleChange(event) {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("username", formData.email);
            params.append("password", formData.password);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: params.toString()
            });

            const data = await response.json();
            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user_email", formData.email);
                toast.success(data.message || "Login successful!");
                // Redirect to home after 1 second
                setTimeout(() => navigate("/"), 1000);
            } else {
                toast.error(data.detail || "Login failed. Please try again.");
                setLoading(false);
            }
        } catch (err) {
            toast.error("An error occurred while logging in");
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <p className="eyebrow">Login</p>
                <h1>Welcome back!</h1>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" name="password" onChange={handleChange} required />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </section>
        </main>
    )

}