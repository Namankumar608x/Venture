import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, []);

  if (!user) {
    return <p className="p-6 text-slate-400">Loading profile...</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-slate-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-slate-400">Username:</span>{" "}
          <span>{user.username}</span>
        </div>

        <div>
          <span className="text-slate-400">Name:</span>{" "}
          <span>{user.name}</span>
        </div>

        <div>
          <span className="text-slate-400">Email:</span>{" "}
          <span>{user.email}</span>
        </div>
      </div>
    </div>
  );
}
