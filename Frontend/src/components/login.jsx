import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../utils/axiosInstance";

function Login() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const navigate = useNavigate();

  // Auto-login if token exists
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
    } catch {
      localStorage.removeItem("accessToken");
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ---------------- PASSWORD LOGIN (UNCHANGED) ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axiosInstance.post("/auth/login", {
        email: formData.emailOrUsername,
        password: formData.password,
      });

      const token = res.data.accessToken;

      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", res.data.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      navigate("/home", { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid credentials");
    }
  };

  /* ---------------- SEND OTP ---------------- */
  const handleSendOtp = async () => {
    if (!formData.emailOrUsername) {
      setMessage("Please enter your email first");
      return;
    }

    try {
      setLoadingOtp(true);
      setMessage("");

      await axiosInstance.post("/auth/send-otp", {
        email: formData.emailOrUsername,
      });

      setOtpSent(true);
      setMessage("OTP sent to your email");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async () => {
    if (!otp) {
      setMessage("Please enter OTP");
      return;
    }

    try {
      setLoadingOtp(true);

      const res = await axiosInstance.post("/auth/verify-otp", {
        email: formData.emailOrUsername,
        otp,
      });

      const token = res.data.accessToken;

      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", res.data.refreshToken || "");
      localStorage.setItem("user", JSON.stringify(res.data.user || {}));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate("/home", { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoadingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900/80 border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md backdrop-blur">
        <h1 className="text-3xl font-bold text-center text-indigo-400 mb-1">
          Login
        </h1>
        <p className="text-center text-sm text-gray-400 mb-6">
          Welcome back to <span className="font-semibold text-indigo-300">Venture</span>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email / Username
            </label>
            <input
              type="text"
              name="emailOrUsername"
              value={formData.emailOrUsername}
              onChange={handleChange}
              placeholder="Enter your email or username"
              className="w-full mt-1 p-2.5 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full mt-1 p-2.5 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* PASSWORD LOGIN */}
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-semibold mt-2"
          >
            Login with Password
          </button>

          <div className="text-center my-4 text-gray-400">OR</div>

          {/* OTP LOGIN */}
          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loadingOtp}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg font-semibold"
            >
              {loadingOtp ? "Sending OTP..." : "Login with OTP"}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full mt-3 p-2.5 bg-gray-950 border border-gray-700 rounded-lg"
              />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loadingOtp}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg"
              >
                {loadingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {message && (
            <p className="text-center mt-4 text-sm text-red-400">{message}</p>
          )}
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
