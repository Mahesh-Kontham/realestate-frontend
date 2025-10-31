import { useState, useTransition } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";


export default function Login(){
  const[email,setEmail]=useState("");
  const[password,setPassword]= useState("");
  const router = useRouter();

   const handlelogin=async()=>{
       if(!email || !password){
        alert("Please Enter Email and Password")
        return;
       }
        const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
     });
      if (error) {
      alert("Login failed: " + error.message);
    } else {
      alert("Login successful!");
      localStorage.setItem("userEmail", email);
      router.push("/dashboard");
    }

   }


  return(
      
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-2xl shadow-md w-96">
      <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <button
        onClick={handlelogin}
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
      >
        Sign In
      </button>
    </div>
  </div>
);

 
}