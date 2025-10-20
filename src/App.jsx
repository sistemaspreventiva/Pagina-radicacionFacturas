// src/App.jsx
import { Link, NavLink } from "react-router-dom";
import AppRoutes from "./AppRoutes.jsx";
import logo from "./assets/logo.svg";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ...tu header... */}
      <main className="flex-1">
        <AppRoutes />
      </main>
      {/* ...tu footer... */}
    </div>
  );
}
