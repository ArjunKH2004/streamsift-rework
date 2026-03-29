"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("Select Platform");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");

  const platforms = [
    "Twitch",
    "YouTube",
    "Instagram Live",
    "TikTok Live"
  ];

  const handleAnalyze = () => {
    if (!streamUrl) {
      alert("Please enter a stream URL");
      return;
    }
    const platform = selectedPlatform === "Select Platform" ? "" : selectedPlatform.toLowerCase();
    router.push(`/analyze?url=${encodeURIComponent(streamUrl)}${platform ? `&platform=${platform}` : ""}`);
  };

  return (
    <footer className="relative py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-black via-blue-900/20 to-blue-900/40">
      <div className="max-w-4xl mx-auto">
        {/* Get Started Container with gradient border */}
        <div className="relative">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 rounded-2xl p-[2px]">
            <div className="bg-black/80 backdrop-blur-lg rounded-2xl h-full w-full"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 sm:p-12 text-center">
            <h2 className="text-white mb-8 font-gilroy text-2xl sm:text-3xl md:text-4xl font-bold">
              Get Started
            </h2>

            {/* Input and Dropdown Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Stream URL Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter Stream URL"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-gray-800/80 transition-all font-gilroy text-sm sm:text-base"
                />
              </div>

              {/* Platform Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-full sm:min-w-[200px] px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/60 border border-gray-600/30 rounded-xl text-gray-400 hover:bg-gray-800/80 focus:outline-none focus:border-purple-500/50 transition-all font-gilroy text-sm sm:text-base"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="16"
                    viewBox="0 0 28 16"
                    fill="none"
                    className={`mr-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M25 3L15.5714 12.3542C14.7035 13.2153 13.2965 13.2153 12.4286 12.3542L3 3"
                      stroke="url(#paint0_linear_263_28)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_263_28"
                        x1="25.023"
                        y1="2.99387"
                        x2="17.4762"
                        y2="19.5967"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0.169872" stopColor="#1ACFFE" />
                        <stop offset="0.57286" stopColor="#7629FE" />
                        <stop offset="0.866427" stopColor="#5F28FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span>{selectedPlatform}</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/90 backdrop-blur-lg border border-gray-600/30 rounded-xl overflow-hidden z-20">
                    {platforms.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 sm:px-6 py-3 text-left text-white hover:bg-gray-700/50 transition-colors font-gilroy text-sm sm:text-base"
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Analyze Button */}
            <button 
              onClick={handleAnalyze}
              className="w-full py-3 sm:py-4 px-6 sm:px-8 text-white font-bold text-base sm:text-lg hover:opacity-90 transition-opacity shadow-lg rounded bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-600 font-gilroy"
            >
              Analyze my Stream
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
