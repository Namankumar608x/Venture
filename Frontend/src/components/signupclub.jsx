// src/components/Signup.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import axiosInstance from "../utils/axiosInstance";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    roll_number:"",
    gender:"",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const {clubid}=useParams();

  const joinclub=async()=>{
    try{
      const res=await axiosInstance.post(`/clubs/join`, {
        clubid
      });
    }catch(err){
      console.log("error adding in club");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const payload = jwtDecode(token);
      if (payload.exp && Date.now() / 1000 < payload.exp) {
        joinclub();
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
      const res = await axiosInstance.post(`/auth/${clubid}/signup`, {
        username: formData.username,
        name: formData.fullName,
        email: formData.email,
        roll_number:formData.roll_number,
        gender:formData.gender,
        password: formData.password,
      });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '700ms'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1400ms'}}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-4">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <h1 className="text-5xl font-bold mb-2 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              VENTURE
            </span>
          </h1>
          <p className="text-slate-400 text-sm">Join the ultimate sports arena</p>
        </div>

        {/* Form Card */}
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 relative overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>

          <div className="relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-slate-400 text-sm">Start your journey to compete</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-user text-indigo-400 text-xs"></i>
                  Username
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all duration-300"
                    placeholder="Choose a username" 
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-indigo-500/10 group-focus-within:via-purple-500/10 group-focus-within:to-pink-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
              </div>

              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-signature text-indigo-400 text-xs"></i>
                  Full Name
                </label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all duration-300"
                  placeholder="Enter your full name" 
                />
              </div>

              {/* Roll Number */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-id-card text-indigo-400 text-xs"></i>
                  Roll Number
                </label>
                <input 
                  type="text" 
                  name="roll_number" 
                  value={formData.roll_number} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all duration-300"
                  placeholder="Enter your roll number" 
                />
              </div>

              {/* Gender */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-venus-mars text-indigo-400 text-xs"></i>
                  Gender
                </label>
                <div className="relative">
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-800">Select gender</option>
                    <option value="Male" className="bg-slate-800">Male</option>
                    <option value="Female" className="bg-slate-800">Female</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm"></i>
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-envelope text-indigo-400 text-xs"></i>
                  Email Address
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all duration-300"
                  placeholder="your@email.com" 
                />
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-lock text-indigo-400 text-xs"></i>
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all duration-300 pr-12"
                    placeholder="Create a strong password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-user-plus"></i>
                    Create Account
                  </span>
                )}
              </button>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-xl text-sm text-center backdrop-blur-sm border ${
                  message.includes('successful') 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <i className={`fa-solid ${message.includes('successful') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {message}
                </div>
              )}
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold hover:from-indigo-300 hover:to-purple-300 transition-all duration-300"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          By signing up, you agree to our{' '}
          <span className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
          {' '}and{' '}
          <span className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;