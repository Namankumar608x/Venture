import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/Login", {
        emailOrUsername: formData.emailOrUsername,
        password: formData.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Login Successful");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setMessage("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900/80 border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md backdrop-blur">
        <h1 className="text-3xl font-bold text-center text-indigo-400 mb-1">
          Login
        </h1>
        <p className="text-center text-sm text-gray-400 mb-6">
          Welcome back to <span className="font-semibold text-indigo-300">LearnFlex</span>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username / Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email / Username
            </label>
            <input
              type="text"
              placeholder="Enter your email or username"
              className="w-full mt-1 p-2.5 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-500"
              required
              value={formData.emailOrUsername}
              name="emailOrUsername"
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mt-1 p-2.5 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-500"
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

          {message && (
            <p className="text-center mt-4 text-sm text-red-400">{message}</p>
          )}
        </form>

        <p className="text-sm text-center mt-6 text-gray-400">
          Don’t have an account?{" "}
          <Link to="/Signup" className="text-indigo-400 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
