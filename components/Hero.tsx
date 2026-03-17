"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden bg-black">
      {/* Earth at the bottom - positioned to show curved edge */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3 z-0">
        <Image
          src="/images/hero/Earth.png"
          alt="Earth"
          width={1400}
          height={700}
          className="object-contain"
          priority
        />
      </div>

      {/* Floating Platform Icons - positioned to match the image exactly */}
      {/* Kick icon - top left */}
      <motion.div
        className="absolute top-32 left-32 z-20"
        animate={{
          y: [-10, 10, -10],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-3 border border-gray-600/30 shadow-2xl">
          <Image
            src="/images/hero/kick.png"
            alt="Kick"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* YouTube icon - top right */}
      <motion.div
        className="absolute top-20 right-32 z-20"
        animate={{
          y: [10, -10, 10],
          rotate: [3, -3, 3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-3 border border-gray-600/30 shadow-2xl">
          <Image
            src="/images/hero/youtube.png"
            alt="YouTube"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      </motion.div>



      {/* Twitch icon - middle right */}
      <motion.div
        className="absolute top-1/2 right-20 transform -translate-y-1/2 translate-y-8 z-20"
        animate={{
          y: [8, -8, 8],
          rotate: [-5, 5, -5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      >
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-3 border border-gray-600/30 shadow-2xl">
          <Image
            src="/images/hero/twitch.png"
            alt="Twitch"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-gilroy text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight">
            <span className="text-white block mb-2">Understand Your Audience.</span>
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent block">
              Instantly.
            </span>
          </h1>

          <p className="font-gilroy text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-medium">
            Live Analytics in Real Time
          </p>

          <Link href="/analyze">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Image
                src="/images/hero/Analyze-btn.png"
                alt="Analyze My Stream"
                width={300}
                height={80}
                className="cursor-pointer hover:opacity-90 transition-opacity"
              />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
