"use client";

import { useEffect, useRef } from "react";

declare global {
    interface Window {
        Twitch: any;
    }
}

interface TwitchPlayerProps {
    channel: string;
}

export default function TwitchPlayer({ channel }: TwitchPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (!channel || !containerRef.current) return;

        // Clean up previous player
        if (playerRef.current) {
            containerRef.current.innerHTML = "";
            playerRef.current = null;
        }

        const createPlayer = () => {
            if (!containerRef.current) return;
            // Clear container before creating new embed
            containerRef.current.innerHTML = "";

            const embed = new window.Twitch.Embed("twitch-embed-container", {
                channel: channel,
                width: "100%",
                height: "100%",
                layout: "video",
                autoplay: true,
                muted: true,
                parent: ["localhost"],
            });

            playerRef.current = embed;
        };

        // Check if Twitch SDK is already loaded
        if (window.Twitch && window.Twitch.Embed) {
            createPlayer();
        } else {
            // Load the Twitch Embed script
            const existingScript = document.getElementById("twitch-embed-script");
            if (existingScript) {
                existingScript.addEventListener("load", createPlayer);
            } else {
                const script = document.createElement("script");
                script.id = "twitch-embed-script";
                script.src = "https://embed.twitch.tv/embed/v1.js";
                script.async = true;
                script.onload = createPlayer;
                document.body.appendChild(script);
            }
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
            playerRef.current = null;
        };
    }, [channel]);

    return (
        <div
            id="twitch-embed-container"
            ref={containerRef}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
    );
}
