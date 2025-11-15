import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    // Save email so Dashboard can detect Owner/Admin
    localStorage.setItem("userEmail", email);

    alert("Login successful!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Welcome Back 👋
        </h1>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full p-3 rounded-lg font-medium text-white transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          }`}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-gray-500 dark:text-gray-400 mx-3 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
        </div>

        {/* Signup Link */}
        <p className="text-center text-gray-600 dark:text-gray-300">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}
