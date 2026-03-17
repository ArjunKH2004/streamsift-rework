"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Users, Eye, MessageCircle, Heart, Play, UserPlus, TrendingUp, Smile, Meh, Frown, ArrowUp, ArrowDown, Minus, Zap, BarChart3, Lightbulb } from "lucide-react";
import Navigation from "@/components/Navigation";
import Image from "next/image";
import { getVideoInfo, analyzeStatic, getLiveChatId, analyzeLive, connectTwitchChannel, disconnectTwitchChannel, getTwitchMessages, getTwitchAnalytics, getTwitchSuggestions, connectKickChannel, disconnectKickChannel, getKickMessages, getKickAnalytics, getKickSuggestions, getYouTubeSuggestions } from "@/app/services/api";

import TwitchPlayer from "@/components/TwitchPlayer";

const platforms = [
    { id: "twitch", name: "Twitch" },
    { id: "youtube", name: "YouTube" },
    { id: "kick", name: "Kick" },
];

export default function AnalyzePage() {
    const [streamUrl, setStreamUrl] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [videoContext, setVideoContext] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [activeVideoId, setActiveVideoId] = useState("");
    const [activeLiveChatId, setActiveLiveChatId] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Twitch-specific state
    const [twitchChannel, setTwitchChannel] = useState("");
    const [twitchConnected, setTwitchConnected] = useState(false);
    const [twitchAnalytics, setTwitchAnalytics] = useState<any>(null);
    const [twitchSuggestions, setTwitchSuggestionsData] = useState<any>(null);

    // Kick-specific state
    const [kickChannel, setKickChannel] = useState("");
    const [kickConnected, setKickConnected] = useState(false);
    const [kickAnalytics, setKickAnalytics] = useState<any>(null);
    const [kickSuggestions, setKickSuggestionsData] = useState<any>(null);

    // Auto-scroll chat to bottom when new comments arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [comments]);

    // Auto-detect platform from URL
    useEffect(() => {
        const url = streamUrl.toLowerCase();
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            setSelectedPlatform("youtube");
        } else if (url.includes("twitch.tv")) {
            setSelectedPlatform("twitch");
        } else if (url.includes("kick.com")) {
            setSelectedPlatform("kick");
        }
    }, [streamUrl]);

    // Helper to calculate summary on client-side for YouTube Live
    const calculateSummary = (counts: any) => {
        if (!counts) return "";
        const g = counts.good || 0;
        const b = counts.bad || 0;
        const n = counts.neutral || 0;
        const total = g + b + n;
        if (total === 0) return "Analyzing...";

        const pg = (g / total) * 100;
        const pb = (b / total) * 100;
        const pn = (n / total) * 100;

        if (pg > 70) return `Overwhelmingly positive (${pg.toFixed(1)}%)! The audience is loving it.`;
        if (pb > 50) return `High negativity (${pb.toFixed(1)}%). Addressing concerns might be needed.`;
        if (pg > pb && pg > 40) return `Mainly positive (${pg.toFixed(1)}%) with some mix.`;
        if (pb > pg && pb > 30) return `Leaning negative (${pb.toFixed(1)}%). Improving sentiment...`;
        if (pn > 60) return "Mostly neutral or chill atmosphere.";
        return "Mixed reactions with no dominant mood.";
    };

    const [ytSuggestions, setYtSuggestions] = useState<any>(null);

    // Poll for YouTube live chat messages every 2 seconds
    useEffect(() => {
        if (!activeLiveChatId) return;

        const interval = setInterval(async () => {
            try {
                const liveData = await analyzeLive(activeLiveChatId, "", nextPageToken, videoContext);
                if (liveData.messages && liveData.messages.length > 0) {
                    const newComments = liveData.messages.map((m: any, i: number) => ({
                        id: Date.now() + i,
                        username: m.author || "Viewer",
                        message: m.text,
                        color: m.sentiment === "good" ? "#22C55E" : m.sentiment === "bad" ? "#EF4444" : "#8B5CF6"
                    }));
                    
                    setComments(prev => {
                        const updated = [...prev, ...newComments];
                        return updated.slice(-200); // Keep last 200 for local context
                    });

                    setAnalysis((prev: any) => {
                        const newCounts = {
                            good: (prev?.counts?.good || 0) + (liveData.counts.good || 0),
                            bad: (prev?.counts?.bad || 0) + (liveData.counts.bad || 0),
                            neutral: (prev?.counts?.neutral || 0) + (liveData.counts.neutral || 0)
                        };
                        return {
                            ...liveData,
                            counts: newCounts,
                            summary: calculateSummary(newCounts)
                        };
                    });

                    // Fetch suggestions for YouTube every few batch updates
                    if (Math.random() > 0.7) {
                        getYouTubeSuggestions(analysis?.counts || liveData.counts, liveData.messages).then(setYtSuggestions).catch(() => {});
                    }
                }
                if (liveData.nextPageToken) {
                    setNextPageToken(liveData.nextPageToken);
                }
            } catch (error) {
                console.error("Live chat poll error:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [activeLiveChatId, nextPageToken, analysis?.counts]);


    // Poll for Twitch chat messages every 2 seconds
    useEffect(() => {
        if (!twitchConnected || !twitchChannel) return;

        const interval = setInterval(async () => {
            try {
                const data = await getTwitchMessages(twitchChannel);
                if (data.messages && data.messages.length > 0) {
                    const mapped = data.messages.map((m: any, i: number) => ({
                        id: i,
                        username: m.user || m.author || "Viewer",
                        message: m.message,
                        color: m.sentiment === "good" ? "#22C55E" : m.sentiment === "bad" ? "#EF4444" : "#8B5CF6"
                    }));
                    setComments(mapped);
                    setAnalysis({ counts: data.counts, summary: "" });
                }
                const analytics = await getTwitchAnalytics(twitchChannel).catch(() => null);
                if (analytics && !analytics.error) {
                    setTwitchAnalytics(analytics);
                    setAnalysis({
                        counts: analytics.counts,
                        summary: analytics.summary || ""
                    });
                }
                const suggestions = await getTwitchSuggestions(twitchChannel).catch(() => null);
                if (suggestions && !suggestions.error) {
                    setTwitchSuggestionsData(suggestions);
                }
            } catch (error) {
                console.error("Twitch poll error:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [twitchConnected, twitchChannel]);

    // Poll for Kick chat messages every 2 seconds
    useEffect(() => {
        if (!kickConnected || !kickChannel) return;

        const interval = setInterval(async () => {
            try {
                const data = await getKickMessages(kickChannel);
                if (data.messages && data.messages.length > 0) {
                    const mapped = data.messages.map((m: any, i: number) => ({
                        id: i,
                        username: m.user || m.author || "Viewer",
                        message: m.message,
                        color: m.sentiment === "good" ? "#22C55E" : m.sentiment === "bad" ? "#EF4444" : "#8B5CF6"
                    }));
                    setComments(mapped);
                    setAnalysis({ counts: data.counts, summary: "" });
                }
                const analytics = await getKickAnalytics(kickChannel).catch(() => null);
                if (analytics && !analytics.error) {
                    setKickAnalytics(analytics);
                    setAnalysis({
                        counts: analytics.counts,
                        summary: analytics.summary || ""
                    });
                }
                const suggestions = await getKickSuggestions(kickChannel).catch(() => null);
                if (suggestions && !suggestions.error) {
                    setKickSuggestionsData(suggestions);
                }
            } catch (error) {
                console.error("Kick poll error:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [kickConnected, kickChannel]);

    // Disconnect Twitch on unmount
    useEffect(() => {
        return () => {
            if (twitchChannel && twitchConnected) {
                disconnectTwitchChannel(twitchChannel).catch(() => { });
            }
        };
    }, [twitchChannel, twitchConnected]);

    // Disconnect Kick on unmount
    useEffect(() => {
        return () => {
            if (kickChannel && kickConnected) {
                disconnectKickChannel(kickChannel).catch(() => { });
            }
        };
    }, [kickChannel, kickConnected]);

    const extractTwitchChannel = (url: string): string | null => {
        try {
            if (!url.includes("/") && !url.includes(".")) {
                return url.trim().toLowerCase();
            }
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("twitch.tv")) {
                const path = urlObj.pathname.replace(/^\//, "").split("/")[0];
                return path || null;
            }
        } catch {
            return url.trim().toLowerCase() || null;
        }
        return null;
    };

    const extractKickChannel = (url: string): string | null => {
        try {
            if (!url.includes("/") && !url.includes(".")) {
                return url.trim().toLowerCase();
            }
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("kick.com")) {
                const path = urlObj.pathname.replace(/^\//, "").split("/")[0];
                return path || null;
            }
        } catch {
            return url.trim().toLowerCase() || null;
        }
        return null;
    };

    const handleAnalyze = async () => {
        if (!streamUrl || !selectedPlatform) {
            alert("Please fill in all fields (URL and Platform)");
            return;
        }

        setIsLoading(true);
        setComments([]);
        setAnalysis(null);
        setStats(null);
        setTwitchAnalytics(null);
        setTwitchSuggestionsData(null);
        setKickAnalytics(null);
        setKickSuggestionsData(null);

        try {
            if (selectedPlatform === "twitch") {
                // ===== TWITCH FLOW =====
                const channel = extractTwitchChannel(streamUrl);
                if (!channel) {
                    alert("Invalid Twitch URL or channel name");
                    setIsLoading(false);
                    return;
                }

                // Disconnect any previous connection
                if (twitchChannel && twitchConnected) {
                    await disconnectTwitchChannel(twitchChannel).catch(() => { });
                }

                setTwitchChannel(channel);

                // Connect to Twitch IRC
                const result = await connectTwitchChannel(channel);
                if (result.error) {
                    alert(`Twitch error: ${result.error}`);
                    setIsLoading(false);
                    return;
                }

                setTwitchConnected(true);
                setActiveVideoId(""); // Clear YouTube video
                setActiveLiveChatId(null);

                // Set placeholder stats for Twitch
                setStats({
                    title: `Twitch: ${channel}`,
                    views: "Live",
                    likes: "-",
                    comments: "0",
                    platform: "twitch",
                    channel: channel
                });

            } else if (selectedPlatform === "youtube") {
                // ===== YOUTUBE FLOW (existing) =====
                setTwitchConnected(false);
                setTwitchChannel("");

                let videoId = "";
                const urlObj = new URL(streamUrl);
                if (urlObj.hostname.includes("youtube.com")) {
                    videoId = urlObj.searchParams.get("v") || "";
                } else if (urlObj.hostname.includes("youtu.be")) {
                    videoId = urlObj.pathname.slice(1);
                }

                if (!videoId) {
                    alert("Invalid YouTube URL");
                    setIsLoading(false);
                    return;
                }

                setActiveVideoId(videoId);

                const videoInfo = await getVideoInfo(videoId, "");
                setStats(videoInfo);

                const liveChatData = await getLiveChatId(videoId, "");

                if (liveChatData.liveChatId) {
                    setActiveLiveChatId(liveChatData.liveChatId);
                    const liveAnalysis = await analyzeLive(liveChatData.liveChatId, "", undefined, videoContext);
                    setAnalysis(liveAnalysis);
                    if (liveAnalysis.nextPageToken) {
                        setNextPageToken(liveAnalysis.nextPageToken);
                    }
                    setComments(liveAnalysis.messages?.map((m: any, i: number) => ({
                        id: i,
                        username: m.author || "Viewer",
                        message: m.text,
                        color: m.sentiment === "good" ? "#22C55E" : m.sentiment === "bad" ? "#EF4444" : "#8B5CF6"
                    })) || []);
                } else {
                    const staticAnalysis = await analyzeStatic(videoId, "", 50, videoContext);
                    setAnalysis(staticAnalysis);
                    setComments(staticAnalysis.comments.map((c: any, i: number) => ({
                        id: i,
                        username: "Commenter",
                        message: c.text,
                        color: c.sentiment === "good" ? "#22C55E" : c.sentiment === "bad" ? "#EF4444" : "#8B5CF6"
                    })));
                    // Fetch suggestions for static YouTube
                    getYouTubeSuggestions(staticAnalysis.counts, staticAnalysis.comments).then(setYtSuggestions).catch(() => {});
                }
            } else if (selectedPlatform === "kick") {
                // ===== KICK FLOW =====
                const channel = extractKickChannel(streamUrl);
                if (!channel) {
                    alert("Invalid Kick URL or channel name");
                    setIsLoading(false);
                    return;
                }

                // Disconnect any previous Kick connection
                if (kickChannel && kickConnected) {
                    await disconnectKickChannel(kickChannel).catch(() => { });
                }
                // Also disconnect Twitch if active
                if (twitchChannel && twitchConnected) {
                    await disconnectTwitchChannel(twitchChannel).catch(() => { });
                    setTwitchConnected(false);
                    setTwitchChannel("");
                }

                setKickChannel(channel);

                // Fetch chatroom_id from the browser (bypasses Cloudflare)
                let chatroomId: string | undefined;
                try {
                    const kickRes = await fetch(`https://kick.com/api/v2/channels/${channel}`);
                    if (kickRes.ok) {
                        const kickData = await kickRes.json();
                        chatroomId = kickData?.chatroom?.id?.toString();
                        console.log(`Kick chatroom_id resolved from browser: ${chatroomId}`);
                    }
                } catch (e) {
                    console.warn("Browser fetch of Kick API failed, backend will try its own strategies:", e);
                }

                const result = await connectKickChannel(channel, chatroomId);
                if (result.error) {
                    alert(`Kick error: ${result.error}`);
                    setIsLoading(false);
                    return;
                }

                setKickConnected(true);
                setTwitchConnected(false);
                setTwitchChannel("");
                setActiveVideoId("");
                setActiveLiveChatId(null);

                setStats({
                    title: `Kick: ${channel}`,
                    views: "Live",
                    likes: "-",
                    comments: "0",
                    platform: "kick",
                    channel: channel
                });
            } else {
                alert(`${selectedPlatform} support coming soon!`);
            }

        } catch (error: any) {
            console.error("Analysis failed:", error);
            let msg = "Analysis failed. Check console and API Key.";
            if (error instanceof Error) {
                msg = `Error: ${error.message}`;
            }
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedPlatformName =
        platforms.find((p) => p.id === selectedPlatform)?.name || "Select Platform";

    const getSentimentPercent = (type: string) => {
        if (!analysis || !analysis.counts) return 0;
        const total = analysis.counts.good + analysis.counts.bad + analysis.counts.neutral;
        if (total === 0) return 0;
        return Math.round((analysis.counts[type] / total) * 100);
    };

    const isTwitchMode = selectedPlatform === "twitch" && twitchConnected;
    const isKickMode = selectedPlatform === "kick" && kickConnected;
    const isLiveMode = isTwitchMode || isKickMode;
    const liveAnalytics = isTwitchMode ? twitchAnalytics : isKickMode ? kickAnalytics : null;
    const liveSuggestions = isTwitchMode ? twitchSuggestions : isKickMode ? kickSuggestions : null;
    const liveChannel = isTwitchMode ? twitchChannel : isKickMode ? kickChannel : "";

    return (
        <main className="relative bg-black min-h-screen">
            <Navigation />

            {/* Get Started Section */}
            <section className="flex items-center justify-center pt-8 pb-12 px-4">
                <div className="w-full max-w-4xl">
                    {/* Gradient Border Container */}
                    <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400">
                        <div className="bg-[#0a0a0a] rounded-2xl px-6 sm:px-12 py-10 sm:py-14">
                            {/* Title */}
                            <h2 className="text-white text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10">
                                Get Started
                            </h2>

                            {/* Input Container */}
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Stream URL Input */}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={streamUrl}
                                            onChange={(e) => setStreamUrl(e.target.value)}
                                            placeholder={selectedPlatform === "twitch" ? "Enter Twitch channel URL or name (e.g. shroud)" : selectedPlatform === "kick" ? "Enter Kick channel URL or name (e.g. xqc)" : "Enter Stream URL"}
                                            className="w-full px-5 py-4 bg-[#2a2a2a] text-gray-300 placeholder-gray-500 rounded-lg border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base"
                                        />
                                    </div>

                                    {/* Platform Dropdown */}
                                    <div className="relative md:w-48">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full px-5 py-4 bg-[#2a2a2a] text-gray-300 rounded-lg border-none outline-none flex items-center justify-between gap-2 hover:bg-[#333] transition-colors text-base"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-purple-400" />
                                                {selectedPlatformName}
                                            </span>
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] rounded-lg shadow-xl overflow-hidden z-20 border border-gray-700">
                                                {platforms.map((platform) => (
                                                    <button
                                                        key={platform.id}
                                                        onClick={() => {
                                                            setSelectedPlatform(platform.id);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-5 py-3 text-left text-gray-300 hover:bg-[#3a3a3a] transition-colors flex items-center gap-2 ${selectedPlatform === platform.id
                                                            ? "bg-purple-600/20 text-purple-400"
                                                            : ""
                                                            }`}
                                                    >
                                                        {selectedPlatform === platform.id && (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                        {platform.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Video Context (only for YouTube) */}
                            {selectedPlatform !== "twitch" && selectedPlatform !== "kick" && (
                                <textarea
                                    value={videoContext}
                                    onChange={(e) => setVideoContext(e.target.value)}
                                    placeholder="Describe the video context for smarter analysis (e.g. 'A documentary exposing a fraudster' or 'A charity livestream for cancer research')..."
                                    rows={3}
                                    className="w-full px-5 py-4 bg-[#2a2a2a] text-gray-300 placeholder-gray-500 rounded-lg border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base resize-none mb-4"
                                />
                            )}


                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                className="w-full py-4 rounded-lg font-semibold text-white text-lg transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
                                style={{
                                    background:
                                        "linear-gradient(90deg, #8B5CF6 0%, #6366F1 35%, #3B82F6 65%, #06B6D4 100%)",
                                }}
                            >
                                {isLoading ? "Connecting..." : isLiveMode ? "Reconnect" : "Analyze my Stream"}
                            </button>

                            {/* Twitch disconnect button */}
                            {isTwitchMode && (
                                <button
                                    onClick={async () => {
                                        await disconnectTwitchChannel(twitchChannel).catch(() => { });
                                        setTwitchConnected(false);
                                        setTwitchChannel("");
                                        setStats(null);
                                        setAnalysis(null);
                                        setComments([]);
                                        setTwitchAnalytics(null);
                                        setTwitchSuggestionsData(null);
                                    }}
                                    className="w-full mt-3 py-3 rounded-lg font-semibold text-red-400 text-sm border border-red-500/30 hover:bg-red-500/10 transition-all"
                                >
                                    Disconnect from #{twitchChannel}
                                </button>
                            )}

                            {/* Kick disconnect button */}
                            {isKickMode && (
                                <button
                                    onClick={async () => {
                                        await disconnectKickChannel(kickChannel).catch(() => { });
                                        setKickConnected(false);
                                        setKickChannel("");
                                        setStats(null);
                                        setAnalysis(null);
                                        setComments([]);
                                        setKickAnalytics(null);
                                        setKickSuggestionsData(null);
                                    }}
                                    className="w-full mt-3 py-3 rounded-lg font-semibold text-red-400 text-sm border border-red-500/30 hover:bg-red-500/10 transition-all"
                                >
                                    Disconnect from Kick #{kickChannel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stream Analytics Section */}
            {stats && (
                <section className="px-4 pb-16">
                    <div className="w-full max-w-5xl mx-auto space-y-6">

                        {/* Video/Stream Preview with Chat */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Stream Preview */}
                            <div className="flex-1 rounded-xl overflow-hidden bg-[#1a1a1a] relative" style={{ minHeight: '400px' }}>
                                {isTwitchMode && twitchChannel ? (
                                    <TwitchPlayer channel={twitchChannel} />
                                ) : isKickMode && kickChannel ? (
                                    <iframe
                                        src={`https://player.kick.com/${kickChannel}`}
                                        title="Kick stream player"
                                        allow="autoplay; fullscreen"
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full border-0"
                                    ></iframe>
                                ) : activeVideoId ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full border-0"
                                    ></iframe>
                                ) : (
                                    <Image
                                        src="/images/analyze/analyze.png"
                                        alt="Stream Preview"
                                        width={800}
                                        height={450}
                                        className="w-full h-auto object-cover"
                                    />
                                )}
                            </div>

                            {/* Live Chat */}
                            <div ref={chatContainerRef} className="lg:w-64 bg-[#1a1a1a] rounded-xl p-4 max-h-[320px] overflow-y-auto">
                                <div className="space-y-3">
                                    {comments.length > 0 ? (
                                        comments.slice(-100).map((comment, index) => (
                                            <div key={index} className="flex gap-2">
                                                <div
                                                    className="w-1 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: comment.color }}
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: comment.color }}>
                                                        {comment.username}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">{comment.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm text-center">
                                            {isLiveMode ? "Waiting for chat messages..." : "No comments found."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stream Insights */}
                        <div className="bg-[#1a1a1a] rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                <h3 className="text-white text-lg font-bold">Stream Insights: {stats.title}</h3>
                            </div>

                            {isLiveMode && liveAnalytics ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <MessageCircle className="w-5 h-5 text-cyan-400" />
                                            <span className="text-white text-2xl font-bold">{liveAnalytics.total_messages || 0}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Messages</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Zap className="w-5 h-5 text-yellow-400" />
                                            <span className="text-white text-2xl font-bold">{liveAnalytics.stream_score || 50}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Stream Score</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Smile className="w-5 h-5 text-green-400" />
                                            <span className="text-white text-2xl font-bold">{liveAnalytics.mood || "—"}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Chat Mood</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <BarChart3 className="w-5 h-5 text-purple-400" />
                                            <span className="text-white text-2xl font-bold">
                                                {liveAnalytics.keywords && liveAnalytics.keywords.length > 0 ? liveAnalytics.keywords[0][0] : "—"}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Top Keyword</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Users className="w-5 h-5 text-blue-400" />
                                            <span className="text-white text-2xl font-bold">Live</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Status</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Eye className="w-5 h-5 text-blue-400" />
                                            <span className="text-white text-2xl font-bold">{stats.views !== "Live" ? parseInt(stats.views).toLocaleString() : "Live"}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Total Views</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Heart className="w-5 h-5 text-pink-400" />
                                            <span className="text-white text-2xl font-bold">{stats.likes !== "-" ? parseInt(stats.likes).toLocaleString() : "-"}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Likes</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <MessageCircle className="w-5 h-5 text-cyan-400" />
                                            <span className="text-white text-2xl font-bold">{parseInt(stats.comments).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">Comments</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audience Sentiment Analysis */}
                        {analysis && (
                            <div className="bg-[#1a1a1a] rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                                        <Smile className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-white text-lg font-bold">Audience Sentiment Analysis</h3>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Current Stream Sentiment */}
                                    <div className="lg:w-1/3">
                                        <p className="text-gray-400 text-sm mb-4">Sentiment Breakdown</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Smile className="w-5 h-5 text-green-400" />
                                                    <span className="text-white">Positive</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-400 font-bold">{getSentimentPercent("good")}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Meh className="w-5 h-5 text-blue-400" />
                                                    <span className="text-white">Neutral</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-blue-400 font-bold">{getSentimentPercent("neutral")}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Frown className="w-5 h-5 text-red-400" />
                                                    <span className="text-white">Negative</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-400 font-bold">{getSentimentPercent("bad")}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sentiment Distribution */}
                                    <div className="lg:flex-1">
                                        <p className="text-gray-400 text-sm mb-4">Sentiment Distribution</p>
                                        {/* Sentiment Bar */}
                                        <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                                            <div className="bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${getSentimentPercent("good")}%` }}></div>
                                            <div className="bg-gradient-to-r from-red-400 to-red-500" style={{ width: `${getSentimentPercent("bad")}%` }}></div>
                                            <div className="bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: `${getSentimentPercent("neutral")}%` }}></div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-400 text-sm">
                                                <span className="text-white font-semibold">Summary:</span> {analysis.summary || "No summary available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live Stream Suggestions (Twitch, Kick, or YouTube) */}
                        {((isLiveMode && liveSuggestions) || (selectedPlatform === "youtube" && ytSuggestions)) && (
                            <div className="bg-[#1a1a1a] rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                                    <h3 className="text-white text-lg font-bold">AI Insights & Suggestions</h3>
                                </div>
                                <div className="space-y-3">
                                    {(liveSuggestions?.suggestions || ytSuggestions?.suggestions || []).map((s: string, i: number) => (
                                        <div key={i} className="bg-[#222] rounded-lg p-4">
                                            <p className="text-gray-300 text-sm">{s}</p>
                                        </div>
                                    ))}
                                </div>
                                {(liveSuggestions?.note || ytSuggestions?.note) && (
                                    <p className="text-gray-500 text-xs mt-3">{liveSuggestions?.note || ytSuggestions?.note}</p>
                                )}
                            </div>
                        )}


                    </div>
                </section>
            )}
        </main>
    );
}
