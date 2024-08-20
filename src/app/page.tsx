"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthCheckComponent() {
  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div> {/* Dark overlay */}
      <motion.div
        className="relative z-10 text-center text-white px-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide mb-6">
          Welcome to Muhu Voice ChatApp
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-4">
          Your one-stop solution for all your chatting needs. Connect with friends and family like never before.
        </p>
        <p className="text-lg sm:text-xl md:text-2xl mb-8">
          Secure, fast, and reliable communication.
        </p>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button className="text-lg font-bold bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link href="/auth/signin">Lets Get Started</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
