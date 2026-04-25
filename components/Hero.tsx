"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden bg-black">
      {/* Earth at the bottom - positioned to show curved edge */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[20%] lg:translate-y-[30%] w-[200vw] sm:w-[150vw] lg:w-[110vw] max-w-[2500px] z-0 pointer-events-none">
        <Image
          src="/images/hero/Earth.png"
          alt="Earth"
          width={2500}
          height={1250}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* Floating Platform Icons - positioned to match the image exactly */}
      {/* Kick icon - top left */}
      <motion.div
        className="absolute top-40 left-[5%] md:left-[15%] lg:left-[22%] z-20"
        initial={{ rotate: 12.49 }}
        animate={{
          y: [-15, 15, -15],
          rotate: [12.49, 15.49, 12.49],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/hero/kick.png"
          alt="Kick"
          width={140}
          height={140}
          className="w-24 sm:w-32 lg:w-40 object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* YouTube icon - top right */}
      <motion.div
        className="absolute top-32 right-[5%] md:right-[15%] lg:right-[22%] z-20"
        initial={{ rotate: -12.49 }}
        animate={{
          y: [15, -15, 15],
          rotate: [-12.49, -9.49, -12.49],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <Image
          src="/images/hero/youtube.png"
          alt="YouTube"
          width={140}
          height={140}
          className="w-24 sm:w-32 lg:w-40 object-contain drop-shadow-2xl"
        />
      </motion.div>



      {/* Twitch icon - middle right */}
      <motion.div
        className="absolute top-[65%] right-[10%] lg:right-[20%] z-20"
        initial={{ rotate: -23 }}
        animate={{
          y: [12, -12, 12],
          rotate: [-23, -20, -23],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      >
        <Image
          src="/images/hero/twitch.png"
          alt="Twitch"
          width={150}
          height={150}
          className="w-28 sm:w-36 lg:w-44 object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-gilroy font-bold mb-6 leading-tight">
            <span className="text-white block mb-2 text-4xl sm:text-5xl md:text-6xl lg:text-[76px] whitespace-nowrap">Understand Your Audience.</span>
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent block text-6xl sm:text-7xl md:text-8xl lg:text-[140px] leading-none mt-2">
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
