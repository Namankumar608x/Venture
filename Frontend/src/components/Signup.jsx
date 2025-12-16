// src/components/Signup.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import axiosInstance from "../utils/axiosInstance";
function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // If user already has a valid token, go to home
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const payload = jwtDecode(token);
      if (payload.exp && Date.now() / 1000 < payload.exp) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        navigate("/home", { replace: true });
      } else {
        localStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];
      }
    } catch (e) {
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

    if (!formData.username || !formData.fullName || !formData.email || !formData.password) {
      setMessage("Please fill all the fields");
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      const res = await axiosInstance.post("/auth/signup", {
        username: formData.username,
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      // backend returns tokens; store them and set default header
      const token = res.data.accessToken;
      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", res.data.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      setMessage("Registration successful");
      console.log("Signup response:", res.data);
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Signup error:", err);
      setMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Ven<span className="text-blue-500">ture</span>
          </h1>
          <p className="text-slate-400 mt-4 text-sm">Join the ultimate sports arena</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm mb-6">Start your journey to compete</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Choose a username" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg" placeholder="Enter your full name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg" placeholder="Create a strong password" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg">
              {isLoading ? "Creating..." : "Create Account"}
            </button>

            {message && <div className="p-4 rounded-lg text-sm text-center mt-3 {message.includes('successful') ? 'text-green-400' : 'text-red-400'}">{message}</div>}
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account? <Link to="/login" className="text-blue-400 font-semibold">Login</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">By signing up, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  );
}

export default Signup;
