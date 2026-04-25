"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#about") {
        setActiveTab("about");
      } else if (pathname === "/compare") {
        setActiveTab("compare");
      } else if (pathname === "/") {
        setActiveTab("home");
      }
    }
  }, [pathname]);

  return (
    <header className="flex justify-center py-4 sm:py-6 sticky top-0 z-50 px-4 bg-black/50 backdrop-blur-md w-full border-b border-gray-800/50">
      <div className="flex items-center w-full max-w-7xl justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/nav/Streamsift_logo.svg"
            alt="StreamSift"
            width={140}
            height={35}
            className="h-7 sm:h-9 w-auto cursor-pointer"
          />
        </Link>

        {/* Navigation Container with gradient border */}
        <nav className="hidden lg:flex items-center bg-gray-900/60 backdrop-blur-lg rounded-full p-1 border-2 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-border relative">
          <div className="flex items-center bg-gray-900/80 rounded-full px-6 py-3 gap-8">
            <Link
              href="/"
              onClick={() => setActiveTab("home")}
              className={`${activeTab === "home" ? "text-purple-400" : "text-gray-300"} font-semibold text-base hover:text-white transition-colors`}
            >
              Home
            </Link>
            <a
              href="/#about"
              onClick={() => setActiveTab("about")}
              className={`${activeTab === "about" ? "text-purple-400" : "text-gray-300"} font-semibold text-base hover:text-white transition-colors`}
            >
              About
            </a>
            <Link
              href="/compare"
              onClick={() => setActiveTab("compare")}
              className={`${activeTab === "compare" ? "text-purple-400" : "text-gray-300"} font-semibold text-base hover:text-white transition-colors`}
            >
              Compare
            </Link>
          </div>
        </nav>

        {/* Analyze My Stream Button */}
        <Link href="/analyze" className="hidden lg:block">
          <Image
            src="/images/nav/Analyze-btn.png"
            alt="Analyze My Stream"
            width={180}
            height={45}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl mx-4 mt-4">
          <div className="px-4 sm:px-6 py-6 space-y-4">
            <Link
              href="/"
              onClick={() => { setActiveTab("home"); setIsMenuOpen(false); }}
              className={`block ${activeTab === "home" ? "text-purple-400" : "text-gray-300"} px-4 py-3 rounded-full font-semibold text-center hover:text-white transition-colors text-sm sm:text-base`}
            >
              Home
            </Link>
            <a
              href="/#about"
              onClick={() => { setActiveTab("about"); setIsMenuOpen(false); }}
              className={`block ${activeTab === "about" ? "text-purple-400" : "text-gray-300"} px-4 py-3 rounded-full font-semibold text-center hover:text-white transition-colors text-sm sm:text-base`}
            >
              About
            </a>
            <Link
              href="/compare"
              onClick={() => { setActiveTab("compare"); setIsMenuOpen(false); }}
              className={`block ${activeTab === "compare" ? "text-purple-400" : "text-gray-300"} px-4 py-3 rounded-full font-semibold text-center hover:text-white transition-colors text-sm sm:text-base`}
            >
              Compare
            </Link>
            <Link href="/analyze" className="flex justify-center pt-2">
              <Image
                src="/images/nav/Analyze-btn.png"
                alt="Analyze My Stream"
                width={160}
                height={40}
                className="cursor-pointer hover:opacity-90 transition-opacity w-36 sm:w-40 h-auto"
              />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
