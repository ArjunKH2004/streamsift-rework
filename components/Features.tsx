"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    image: "/images/why/clarity.png",
    title: "Instant Clarity",
    description: "No more guessing what works.",
  },
  {
    image: "/images/why/engagement.png",
    title: "Boost Engagement",
    description: "Get actionable suggestions to keep viewers hooked.",
  },
  {
    image: "/images/why/radar.png",
    title: "Audience Radar",
    description: "See who's tuning in, from where, and why.",
  },
];

export default function Features() {
  return (
    <section id="about" className="relative py-32 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Introduction */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 px-4"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Left side - Text content */}
          <div className="text-left">
            <h2 className="font-gilroy text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
              Introducing{" "}
              <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                StreamSift
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed font-medium mb-6">
              StreamSift is your all-in-one, real-time audience intelligence
              tool for streamers and content creators.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed font-medium mb-6">
              It breaks down the &quot;what just happened?&quot; moments during your
              streams – and turns them into &quot;here&apos;s exactly why!&quot;
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed font-medium">
              Whether you&apos;re on Twitch, YouTube, or Instagram Live, StreamSift
              pulls in data from all your platforms to give you instant,
              AI-powered insights on what your audience loves, skips, or drops
              off from – so you can stream smarter, not harder.
            </p>
          </div>

          {/* Right side - Logo image */}
          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Image
              src="/images/why/logo.png"
              alt="StreamSift Logo"
              width={300}
              height={300}
              className="object-contain w-48 sm:w-56 md:w-64 lg:w-72 max-w-xs"
            />
          </motion.div>
        </motion.div>

        {/* Why StreamSift Section */}
        <motion.div
          id="features"
          className="relative text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Background Image */}
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 z-0 w-screen h-full overflow-hidden">
            <Image
              src="/images/why/background.png"
              alt="Why StreamSift Background"
              fill
              className="object-cover opacity-40"
              priority
              style={{
                filter: "brightness(0.3) contrast(1.2)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 py-20">
            <h3 className="text-white mb-16 font-gilroy text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4">
              Why StreamSift?
            </h3>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-6xl mx-auto px-4 sm:px-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {/* Feature Image */}
                  <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 flex items-center justify-center">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={96}
                        height={96}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <h4 className="text-white mb-6 font-gilroy text-xl sm:text-2xl font-semibold">
                    {feature.title}
                  </h4>
                  <p className="text-gray-300 max-w-xs mx-auto font-gilroy text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
