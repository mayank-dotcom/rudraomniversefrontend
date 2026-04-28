"use client"

import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-9xl font-display font-black tracking-tighter mb-4">404</h1>
        <p className="text-xl text-muted-foreground font-mono uppercase tracking-widest mb-8">Page Not Found</p>
        <a 
          href="/" 
          className="px-8 py-3 bg-white text-black text-xs font-mono uppercase tracking-widest font-bold hover:bg-white/90 transition"
        >
          Return Home
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
