"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if(email === "ncpatel25@gmail.com" && password === "Ncp@12345"){
      sessionStorage.setItem("email", email);
      router.push(`/dashboard/${email}`);    
    } else {
      alert("Invalid Credentials! Please try again.");
    }
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Portfolio Manager</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center mt-4">
        <div className="flex flex-col justify-center">
          <label className="text-left">Enter Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email"
            className="border-2 border-gray-300 text-black p-2 mt-2"
          />
        </div>
        <div className="flex flex-col justify-center">
          <label className="text-left">Enter Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="border-2 border-gray-300 text-black p-2 mt-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white w-full p-2 mt-4 rounded-md"
        >
          Login
        </button>
      </form>
    </main>
  );
}
