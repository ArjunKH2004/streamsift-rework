const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ===== YOUTUBE APIs =====
export const getYouTubeSuggestions = async (counts: any, messages: any[]) => {
    const response = await fetch(`${API_BASE_URL}/api/youtube/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counts, messages }),
    });
    return response.json();
};

export const getVideoInfo = async (videoId: string, apiKey: string) => {

    const response = await fetch(`${API_BASE_URL}/video-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, api_key: apiKey }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `Server Error: ${response.status}`);
    }
    return response.json();
};

export const analyzeStatic = async (videoId: string, apiKey: string, limit: string | number = "all", context: string = "") => {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, api_key: apiKey, limit, context }),
    });
    return response.json();
};

export const getLiveChatId = async (videoId: string, apiKey: string) => {
    const response = await fetch(`${API_BASE_URL}/get-live-chat-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, api_key: apiKey }),
    });
    return response.json();
};

export const analyzeLive = async (liveChatId: string, apiKey: string, pageToken?: string, context: string = "") => {
    const response = await fetch(`${API_BASE_URL}/analyze-live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveChatId, api_key: apiKey, pageToken, context }),
    });
    return response.json();
};

// ===== TWITCH APIs =====
export const connectTwitchChannel = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/twitch/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
    });
    return response.json();
};

export const disconnectTwitchChannel = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/twitch/disconnect/${channel}`, {
        method: "POST",
    });
    return response.json();
};

export const getTwitchMessages = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/twitch/messages/${channel}`);
    return response.json();
};

export const getTwitchAnalytics = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/twitch/analytics/${channel}`);
    return response.json();
};

export const getTwitchSummary = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/twitch/summary/${channel}`);
    return response.json();
};

export const getTwitchSuggestions = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/twitch/suggestions/${channel}`);
    return response.json();
};

// ===== KICK APIs =====
export const connectKickChannel = async (channel: string, chatroomId?: string) => {
    const body: any = { channel };
    if (chatroomId) body.chatroom_id = chatroomId;
    const response = await fetch(`${API_BASE_URL}/api/kick/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return response.json();
};

export const disconnectKickChannel = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/kick/disconnect/${channel}`, {
        method: "POST",
    });
    return response.json();
};

export const getKickMessages = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/kick/messages/${channel}`);
    return response.json();
};

export const getKickAnalytics = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/kick/analytics/${channel}`);
    return response.json();
};

export const getKickSummary = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/kick/summary/${channel}`);
    return response.json();
};

export const getKickSuggestions = async (channel: string) => {
    const response = await fetch(`${API_BASE_URL}/api/kick/suggestions/${channel}`);
    return response.json();
};
