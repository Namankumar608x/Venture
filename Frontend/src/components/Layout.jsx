// src/components/Layout.jsx
import React from "react";
import Inbox from "./Inbox";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* 🔔 GLOBAL INBOX HEADER */}
      <Inbox />

      {/* PAGE CONTENT */}
      <div className="pt-4">{children}</div>
    </div>
  );
}
