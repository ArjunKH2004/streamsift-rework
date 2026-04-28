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

      {/* New Neat & Tidy Footer Section */}
      <div className="max-w-6xl mx-auto mt-20 sm:mt-32 border-t border-gray-800/60 pt-16">
        {/* Top CTA */}
        <div className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-gilroy">Ready to turn chaos into clarity?</h3>
          <p className="text-gray-400 text-lg sm:text-xl">Analyze comments faster with StreamSift</p>
        </div>

        {/* Team Section */}
        <div id="team" className="mb-20">
          <h4 className="text-xl font-bold text-white text-center mb-10 font-gilroy uppercase tracking-wider text-gray-500">Meet Team StreamSift</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Team Member 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-900/30 rounded-2xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">A</div>
              <h5 className="text-white font-bold text-lg mb-1">K H Arjun</h5>
              <p className="text-gray-400 text-sm text-center">Branding, Frontend, Deployment</p>
              <div className="flex gap-4 mt-4 h-5">
                <a href="https://www.linkedin.com/in/kharjun/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077b5] transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                </a>
                <a href="https://www.instagram.com/a.rjunnn._" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" /></svg>
                </a>
                <a href="https://www.behance.net/arjunkh" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1769ff] transition-colors" aria-label="Behance">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.908 5.199 4.796l.015 1.338H13.62c-.05 1.705 1.258 3.513 3.659 3.513 1.311 0 2.455-.429 2.929-1.229l2.518 1.177zm-5.111-5.759c-1.579 0-2.32 1.107-2.457 2.215h4.86c-.1-1.215-.811-2.215-2.403-2.215zM8.349 19.349h-8.349v-13.63h8.043c2.973 0 5.086 1.493 5.086 4.195 0 2.053-1.077 3.003-2.316 3.493 1.637.388 2.857 1.644 2.857 3.86 0 2.311-2.025 4.318-5.321 4.318zm-4.795-10.957v3.238h4.436c1.196 0 1.909-.643 1.909-1.597 0-.913-.674-1.641-1.89-1.641h-4.455zm0 9.207h4.887c1.378 0 2.126-.643 2.126-1.764 0-1.115-.811-1.734-2.203-1.734h-4.81v3.498z" clipRule="evenodd" /></svg>
                </a>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-900/30 rounded-2xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">S</div>
              <h5 className="text-white font-bold text-lg mb-1">Safwan Ahamed</h5>
              <p className="text-gray-400 text-sm text-center">Model Training</p>
            </div>

            {/* Team Member 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-900/30 rounded-2xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">N</div>
              <h5 className="text-white font-bold text-lg mb-1">Nijith Antachen</h5>
              <p className="text-gray-400 text-sm text-center">Backend Development</p>
            </div>

            {/* Team Member 4 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-900/30 rounded-2xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">N</div>
              <h5 className="text-white font-bold text-lg mb-1">Nikesh D&apos;Silva</h5>
              <p className="text-gray-400 text-sm text-center">Backend Development</p>
              <div className="flex gap-3 mt-4 h-5">
                <a href="https://www.linkedin.com/in/nikesh-d-silva-a103072a2/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077b5] transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/60 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-bold mb-2 text-lg">StreamSift filters the noise, finds the signal.</p>
            <p className="text-gray-500 text-sm">© 2026 StreamSift. Built by Team StreamSift</p>
          </div>
          
          <div className="flex gap-8 text-gray-400 text-sm font-medium">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/#features" className="hover:text-white transition-colors">Features</a>
            <a href="/#team" className="hover:text-white transition-colors">Team</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
