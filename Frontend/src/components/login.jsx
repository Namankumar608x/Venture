// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

function Login() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // If user already has a valid token, go to home
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return; // no token -> stay on login
    try {
      const payload = jwtDecode(token);
      if (payload.exp && Date.now() / 1000 < payload.exp) {
        // token valid -> set default header and navigate
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        navigate("/home", { replace: true });
      } else {
        // token expired -> clean up
        localStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];
      }
    } catch (err) {
      // malformed token
      localStorage.removeItem("accessToken");
      delete axios.defaults.headers.common["Authorization"];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5005/auth/login", {
        email: formData.emailOrUsername,
        password: formData.password,
      });
    console.log("Access token BEFORE saving:", res.data.accessToken);

      // Save token BEFORE navigation (single canonical key)

      const token = res.data.accessToken;
console.log("Token variable:", token);

      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", res.data.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
        // set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      setMessage("Login successful");
      console.log("Login response:", res.data);
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setMessage(err.response?.data?.error || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900/80 border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md backdrop-blur">
        <h1 className="text-3xl font-bold text-center text-indigo-400 mb-1">Login</h1>
        <p className="text-center text-sm text-gray-400 mb-6">
          Welcome back to <span className="font-semibold text-indigo-300">Venture</span>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300">Email / Username</label>
            <input
              type="text"
              placeholder="Enter your email or username"
              className="w-full mt-1 p-2.5 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-500"
              required
              value={formData.emailOrUsername}
              name="emailOrUsername"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mt-1 p-2.5 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-500"
              required
              value={formData.password}
              name="password"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-semibold mt-2 transition-colors"
          >
            Login
          </button>

          {message && <p className="text-center mt-4 text-sm text-red-400">{message}</p>}
        </form>

        <p className="text-sm text-center mt-6 text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-400 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
