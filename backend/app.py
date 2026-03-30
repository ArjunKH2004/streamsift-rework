from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from googleapiclient.discovery import build
from textblob import TextBlob
import re
import json
import numpy as np
import pandas as pd
import pickle
import google.generativeai as genai
import socket
import threading
import time
import random
import requests
from datetime import datetime
from collections import deque, Counter

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ===== SKLEARN MODEL SETUP =====
import os
import sys
import pickle
import traceback

# ===== PICKLE PATCH FOR MISSING Vectorizer =====
import sys
import types
from sklearn.feature_extraction.text import TfidfVectorizer

# Define the missing class locally
class tfIdfInheritVectorizer(TfidfVectorizer):
    """Placeholder for the missing vectorizer class used during pickling."""
    pass

# Mock the module so pickle can find it regardless of how it was saved
# We try to satisfy both 'tfIdfInheritVectorizer' and 'backend.tfIdfInheritVectorizer'
mock_mod = types.ModuleType("tfIdfInheritVectorizer")
mock_mod.tfIdfInheritVectorizer = tfIdfInheritVectorizer
sys.modules["tfIdfInheritVectorizer"] = mock_mod

# ===== SKLEARN MODEL SETUP =====
import os
import pickle
import traceback

# Add backend and root to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
for d in [BASE_DIR, ROOT_DIR]:
    if d not in sys.path:
        sys.path.insert(0, d)

MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(BASE_DIR, "yt_ai_classifier_model_2.sav"))
VECTORIZER_PATH = os.environ.get("VECTORIZER_PATH", os.path.join(BASE_DIR, "tfidf_vectorizer.sav"))

# Label mapping: adjust based on your model's output classes
# Common mappings: 0 = negative/bad, 1 = neutral, 2 = positive/good
id2label = {0: "bad", 1: "neutral", 2: "good"}

# ===== LOAD MODEL =====
model = None
vectorizer = None

try:
    print(f"Loading classifier from: {MODEL_PATH}")
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
    else:
        print(f"ERROR: Model file not found at {MODEL_PATH}")

    print(f"Loading vectorizer from: {VECTORIZER_PATH}")
    if os.path.exists(VECTORIZER_PATH):
        with open(VECTORIZER_PATH, 'rb') as f:
            # This requires 'tfIdfInheritVectorizer' module to be available in sys.path
            vectorizer = pickle.load(f)
    else:
        print(f"ERROR: Vectorizer file not found at {VECTORIZER_PATH}")

    if model and vectorizer:
        print("Models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")
    traceback.print_exc()
    model = None
    vectorizer = None

def preprocess(text):
    """Clean text by removing URLs."""
    return re.sub(r"http\S+", "", str(text))

def predict_sentiment(text):
    """Predict sentiment for a single text using sklearn model."""
    if not model or not vectorizer:
        return "neutral", {"bad": 0.33, "neutral": 0.34, "good": 0.33}
    
    clean_text = preprocess(text)
    features = vectorizer.transform([clean_text])
    pred = model.predict(features)[0]
    
    # Try to get probabilities if model supports it
    try:
        probs = model.predict_proba(features)[0]
        prob_dict = {id2label[i]: float(probs[i]) for i in range(len(probs))}
    except:
        prob_dict = {"bad": 0.33, "neutral": 0.34, "good": 0.33}
        prob_dict[id2label[pred]] = 1.0
    
    label = id2label.get(pred, "neutral")
    return label, prob_dict

def predict_batch(texts, batch_size=16):
    """Predict sentiment for multiple texts in batches."""
    if not model or not vectorizer:
        return [("neutral", {"bad": 0.33, "neutral": 0.34, "good": 0.33}) for _ in texts]
    
    results = []
    clean_texts = [preprocess(t) for t in texts]
    features = vectorizer.transform(clean_texts)
    predictions = model.predict(features)
    
    # Try to get probabilities
    try:
        all_probs = model.predict_proba(features)
        has_probs = True
    except:
        has_probs = False
    
    for i, pred in enumerate(predictions):
        label = id2label.get(pred, "neutral")
        if has_probs:
            probs = all_probs[i]
            prob_dict = {id2label[j]: float(probs[j]) for j in range(len(probs))}
        else:
            prob_dict = {"bad": 0.33, "neutral": 0.34, "good": 0.33}
            prob_dict[label] = 1.0
        results.append((label, prob_dict))
    
    return results


# ===== SENTIMENT CLASSIFICATION (VMAX Enhanced) =====
SLANG = {
    r'\bpog\b|\bpoggers\b|\bpogchamp\b': 'amazing',
    r'\bgg\b|\bggwp\b': 'great game',
    r'\bkekw\b|\blul\b|\blmaooo+\b': 'laughing funny',
    r'\bcopium\b': 'coping disappointed',
    r'\bhopium\b': 'hoping optimistic',
    r'\bsadge\b': 'sad disappointed',
    r'\bbased\b': 'respectable good',
    r'\bcringe\b': 'embarrassing bad',
    r'\bratio\b': 'disagreeing wrong',
    r'\bsheesh\b|\bsheeesh\b': 'impressive amazing',
    r'\bw\b(?!\w)': 'win',
    r'\bl\b(?!\w)': 'loss fail',
    r'\bngl\b': 'honestly',
    r'\bfrfr\b': 'seriously',
    r'\bno cap\b': 'honestly seriously',
    r'\bslay\b': 'excellent amazing',
    r'\bnpc\b': 'boring fake',
    r'\bmonkas\b|\bmonkaw\b': 'nervous scared',
}

TWITCH_EMOTES = {
    "PogChamp": "😲", "Pog": "😲", "Poggers": "😲",
    "Kappa": "😏", "KappaPride": "🏳️‍🌈",
    "LUL": "😂", "KEKW": "🤣", "OMEGALUL": "🤣",
    "BibleThump": "😭", "Sadge": "😢",
    "residentsleeper": "😴", "HeyGuys": "👋",
    "NotLikeThis": "🤦", "WutFace": "😱",
    "CoolStoryBob": "🙄", "SeemsGood": "👍",
    "KomodoHype": "🦎", "Prayge": "🙏", "Copium": "🧪",
}

def transform_emotes(text):
    # Handle Bit Cheers (Cheer1, Cheer100, etc)
    text = re.sub(r'\bcheer\d+\b', '💎', text, flags=re.IGNORECASE)
    # Handle basic Twitch emotes
    for code, emoji in TWITCH_EMOTES.items():
        text = re.sub(rf'\b{code}\b', emoji, text)
    return text

def expand_slang(text):
    text = text.lower()
    for pat, rep in SLANG.items():
        text = re.sub(pat, rep, text)
    return text

def classify_simple(text):
    if not text: return "neutral"
    clean = text.strip()
    if re.match(r'^[!@/]\w*$', clean) or re.match(r'^\d+$', clean) or len(clean) < 2:
        return "neutral"
    expanded = expand_slang(clean)
    positive_words = {'amazing','great','love','best','awesome','perfect','incredible','wonderful'}
    if clean.isupper() and len(clean.split()) > 1:
        if any(w in expanded for w in positive_words):
            expanded = "not " + expanded
    blob = TextBlob(expanded)
    p = blob.sentiment.polarity
    if p > 0.05: return "good"
    if p < -0.05: return "bad"
    return "neutral"

def get_msg_intent(text):
    text = text.lower()
    if "?" in text: return "questioning"
    if any(w in text for w in ["lag", "fix", "scam", "audio", "broken", "help"]): return "complaint"
    if any(w in text for w in ["bad", "l", "cringe", "boring", "ratio", "worst"]): return "criticism"
    if any(w in text for w in ["toxic", "stfu", "hate", "kys", "trash"]): return "toxic"
    return None

def calculate_stream_mood(messages):
    if not messages: return "Neutral ⚪"
    total = len(messages)
    counts = Counter([m.get("intent") for m in messages if m.get("intent")])
    sentiments = Counter([m.get("sentiment") for m in messages])
    
    # Ratios
    pq = (counts.get("questioning", 0) / total) * 100
    pcomp = (counts.get("complaint", 0) / total) * 100
    pcrit = (counts.get("criticism", 0) / total) * 100
    ptox = (counts.get("toxic", 0) / total) * 100
    pgood = (sentiments.get("good", 0) / total) * 100
    pbad = (sentiments.get("bad", 0) / total) * 100

    # Heuristics
    if ptox > 15: return "Hatred/Toxic 🤬"
    if pq > 20: return "Questioning 🧐"
    if pcomp > 15: return "Complaint 😤"
    if pcrit > 25: return "Criticism 😠"
    if pgood > 65: return "Happy/Hype 🔥"
    if pbad > 40: return "Toxic 😡"
    if pgood > 45: return "Positive 🙂"
    if ptox > 5: return "Tense 😤"
    return "Chill 😌"

def gemini_batch_classify(texts, context, batch_size=30):
    """Use Gemini AI to classify comments relative to the video context.
    
    Sends batches of comments + context to Gemini and asks it to classify
    each comment's audience sentiment as good/bad/neutral.
    Falls back to TextBlob classify_simple if Gemini fails.
    """
    all_results = []
    
    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]
        numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(batch))
        
        prompt = f"""You are a sentiment analyst. Given the video context and a list of audience comments, classify each comment's AUDIENCE SENTIMENT as "good", "bad", or "neutral".

IMPORTANT: Classify based on the audience's intent relative to the video context, NOT the literal wording.
- If the video is about something negative (e.g. a criminal, scam, disaster) and a comment criticizes the negative subject, that is POSITIVE audience sentiment ("good") because the audience is rightly against it.
- If the video is about something positive and a comment praises it, that is also "good".
- Supportive comments toward a negative subject should be classified as "bad".

Video Context: {context}

Comments:
{numbered}

Respond ONLY with a valid JSON array of strings, one per comment, in the same order. Each must be exactly "good", "bad", or "neutral". Example: ["good", "bad", "neutral"]"""
        
        try:
            gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            response = gemini_model.generate_content(prompt)
            text_response = response.text.strip()
            
            # Clean markdown code fences if present
            if text_response.startswith("```"):
                text_response = text_response.split("\n", 1)[1] if "\n" in text_response else text_response[3:]
                if text_response.endswith("```"):
                    text_response = text_response[:-3].strip()

            labels = json.loads(text_response)
            
            # Validate and normalize labels
            valid_labels = {"good", "bad", "neutral"}
            labels = [l.lower().strip() if isinstance(l, str) and l.lower().strip() in valid_labels else "neutral" for l in labels]
            
            # Pad or trim to match batch size
            while len(labels) < len(batch):
                labels.append("neutral")
            labels = labels[:len(batch)]
            
            all_results.extend(labels)
        except Exception as e:
            print(f"Gemini classification failed for batch, falling back to TextBlob: {e}")
            all_results.extend([classify_simple(t) for t in batch])
    
    return all_results

def summarize(counts):
    g, b, n = counts["good"], counts["bad"], counts["neutral"]
    total = g + b + n
    if total == 0:
        return "Not enough data for a summary yet."
        
    pg = (g / total) * 100
    pb = (b / total) * 100
    pn = (n / total) * 100

    if pg > 70:
        return f"Overwhelmingly positive ({pg:.1f}%)! The audience is loving the content."
    if pb > 50:
        return f"Vocal negativity detected ({pb:.1f}%). There are significant complaints or criticisms."
    if pg > pb and pg > 40:
        return f"Mainly positive ({pg:.1f}%), with some mixed reactions."
    if pb > pg and pb > 30:
        return f"Leaning negative ({pb:.1f}%). Watch out for rising criticism."
    if pn > 60:
        return "Mostly neutral or chill. The audience is watching quietly or engaged in casual chat."
        
    return "The room is mixed. Different opinions are being shared with no clear dominant sentiment."


# ===== API KEYS =====
# YouTube Data API v3
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "AIzaSyB-kZZzAsasrRK3OVOmg0id8cDiAx_wItE")

# Gemini API Key (free from https://ai.google.dev)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDHQnizSt0rJgHYRRa6Pe4PybUZpDK62ec")
genai.configure(api_key=GEMINI_API_KEY)

# Twitch API
TWITCH_SECRET = os.environ.get("TWITCH_SECRET", "t6ufp4pnzzkisxz5oim5vontvzz40n")

# Kick API
KICK_CLIENT_ID = os.environ.get("KICK_CLIENT_ID", "01KKHHF5BP1WD1N566KH7P5BCS")


# ===== PLATFORM HELPERS =====
# YouTube API client. Uses hardcoded key if none provided.
def yt(api_key=None):
    key = api_key or YOUTUBE_API_KEY
    return build("youtube", "v3", developerKey=key)



# ===== ROUTES =====
@app.route("/")
def home():
    return render_template("index.html")

# ===== DEBUG MODELS =====
@app.route("/api/debug/models")
def debug_models():
    res = {
        "cwd": os.getcwd(),
        "sys_path": sys.path,
        "base_dir": BASE_DIR,
        "root_dir": ROOT_DIR,
        "model_path": MODEL_PATH,
        "vectorizer_path": VECTORIZER_PATH,
        "model_exists": os.path.exists(MODEL_PATH),
        "vectorizer_exists": os.path.exists(VECTORIZER_PATH),
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
        "files_in_base": os.listdir(BASE_DIR) if os.path.exists(BASE_DIR) else [],
        "files_in_root": os.listdir(ROOT_DIR) if os.path.exists(ROOT_DIR) else []
    }
    return jsonify(res)

# ===== VIDEO INFO =====
@app.route("/video-info", methods=["POST"])
def video_info():
    try:
        d = request.json
        print(f"Received video-info request: {d}") # Debug
        y = yt(d["api_key"])

        res = y.videos().list(
            part="snippet,statistics",
            id=d["video_id"]
        ).execute()

        if not res["items"]:
            return jsonify({"error": "Video not found"}), 404

        v = res["items"][0]
        return jsonify({
            "title": v["snippet"]["title"],
            "published": v["snippet"]["publishedAt"],
            "views": v["statistics"].get("viewCount", 0),
            "likes": v["statistics"].get("likeCount", 0),
            "comments": v["statistics"].get("commentCount", 0)
        })
    except Exception as e:
        print(f"Error in video-info: {e}")
        return jsonify({"error": str(e)}), 500

# ===== STATIC ANALYSIS =====
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if not model or not vectorizer:
            return jsonify({"error": "Model not loaded"}), 500
             
        d = request.json
        y = yt(d["api_key"])
        limit = d["limit"]
        context = d.get("context", "").strip()

        comments = []
        page = None

        while limit == "all" or len(comments) < int(limit):
            res = y.commentThreads().list(
                part="snippet",
                videoId=d["video_id"],
                maxResults=100,
                order="time",
                pageToken=page,
                textFormat="plainText"
            ).execute()

            comments.extend(res["items"])
            print(f"Fetched {len(comments)} comments so far...")
            page = res.get("nextPageToken")
            if not page:
                break
        
        print(f"Total comments to analyze: {len(comments)}")

        texts = [
            c["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            for c in comments
        ]

        counts = {"good": 0, "bad": 0, "neutral": 0}
        out = []

        if context:
            # Gemini AI context-aware classification
            labels = gemini_batch_classify(texts, context)
            for i, t in enumerate(texts):
                label = labels[i]
                counts[label] += 1
                out.append({
                    "text": t,
                    "sentiment": label,
                    "confidence": 1.0,
                    "probabilities": {"good": 0.0, "bad": 0.0, "neutral": 0.0, label: 1.0}
                })
        else:
            # Standard ML model prediction
            predictions = predict_batch(texts)
            for i, t in enumerate(texts):
                label, probs = predictions[i]
                counts[label] += 1
                out.append({
                    "text": t, 
                    "sentiment": label,
                    "confidence": probs[label],
                    "probabilities": probs
                })

        return jsonify({
            "comments": out,
            "counts": counts,
            "summary": summarize(counts)
        })

    except Exception as e:
        print(f"Error in analyze: {e}")
        return jsonify({"error": str(e)}), 500

# ===== LIVE CHAT ID =====
@app.route("/get-live-chat-id", methods=["POST"])
def get_live_chat_id():
    try:
        d = request.json
        y = yt(d["api_key"])

        res = y.videos().list(
            part="liveStreamingDetails",
            id=d["video_id"]
        ).execute()

        if not res["items"]:
            return jsonify({"error": "Video not found", "liveChatId": None})
        
        liveDetails = res["items"][0].get("liveStreamingDetails")
        if not liveDetails:
            return jsonify({"error": "Not a live video", "liveChatId": None})
        
        chat = liveDetails.get("activeLiveChatId")
        if not chat:
            return jsonify({"error": "No active live chat (stream may have ended)", "liveChatId": None})
        return jsonify({"liveChatId": chat})
    except Exception as e:
        print(f"Error in get-live-chat-id: {e}")
        return jsonify({"error": str(e), "liveChatId": None}), 500

# ===== LIVE POLLING =====
@app.route("/analyze-live", methods=["POST"])
def analyze_live():
    try:
        d = request.json
        y = yt(d["api_key"])
        context = d.get("context", "").strip()

        res = y.liveChatMessages().list(
            liveChatId=d["liveChatId"],
            part="snippet,authorDetails",
            maxResults=200,
            pageToken=d.get("pageToken")
        ).execute()

        msgs = []
        counts = {"good": 0, "bad": 0, "neutral": 0}

        items = res["items"]
        all_texts = [m["snippet"]["displayMessage"] for m in items]
        all_authors = [m.get("authorDetails", {}).get("displayName", "Viewer") for m in items]

        if context and all_texts:
            labels = gemini_batch_classify(all_texts, context)
        else:
            labels = [classify_simple(t) for t in all_texts]

        for i, t in enumerate(all_texts):
            s = labels[i]
            counts[s] += 1
            msgs.append({"text": t, "sentiment": s, "author": all_authors[i]})

        return jsonify({
            "messages": msgs,
            "counts": counts,
            "summary": summarize(counts),
            "nextPageToken": res.get("nextPageToken")
        })
    except Exception as e:
        print(f"Error in analyze-live: {e}")
        return jsonify({"error": str(e)}), 500

# ===== YOUTUBE SUGGESTIONS =====
@app.route("/api/youtube/suggestions", methods=["POST"])
def youtube_suggestions():
    try:
        d = request.json
        counts = d.get("counts", {"good": 0, "bad": 0, "neutral": 0})
        messages = d.get("messages", [])
        
        # Adapt the suggestions logic for YouTube
        suggestions_data = generate_twitch_suggestions(messages, counts)
        return jsonify(suggestions_data)
    except Exception as e:
        print(f"Error in youtube-suggestions: {e}")
        return jsonify({"error": str(e)}), 500

# ===== HEALTH CHECK =====
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


# ===== TWITCH IRC CLIENT =====
twitch_chat_buffers = {}
MAX_BUFFER_SIZE = 10000
active_twitch_connections = {}

# ===== KICK CHAT =====
kick_chat_buffers = {}
active_kick_connections = {}

def detect_spam(message):
    """Filter out spam messages."""
    if len(message) < 2:
        return True
    if re.search(r'(.)\1{5,}', message):
        return True
    if len(message) > 10 and sum(1 for c in message if c.isupper()) / len(message) > 0.7:
        return True
    return False

# ===== ADVANCED ANALYTICS (from VMAX) =====
STOP_WORDS = {
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'is','are','was','were','been','be','have','has','had','do','does','did',
    'will','would','should','could','may','might','must','can','shall',
    'this','that','these','those','here','there','where','when','why','how',
    'what','who','which','all','any','each','every','both','few','more',
    'most','other','some','such','no','not','only','same','so','than','too',
    'very','just','then','now','also','about','after','before','up','out',
    'if','its','into','through','during','until','against','nor','as',
    'from','by','between','i','you','he','she','it','we','they','me','him',
    'her','us','them','my','your','his','our','their','mine','yours','hers',
    'ours','myself','yourself','himself','herself','itself','themselves',
}

TOPIC_SIGNALS = {
    'clutch','aimbot','headshot','wallhack','rank','ranked','queue','match',
    'gameplay','clip','highlight','moment','replay','vod','raid','sub',
    'subbed','bits','donation','donated','merch','sponsor','crying','screaming',
    'insane','crazy','incredible','impressive','hilarious','terrible','awful',
    'disgusting','perfect','impossible','destroyed','dominated','stomped',
    'carried','choking','setup','fps','ping','lag','stutter','freeze','crash',
    'audio','mic','camera','overlay','discord','reddit','twitter','youtube',
    'tiktok','champion','victory','defeat','round','tournament','scrim','warmup',
}

def extract_keywords(messages, top_n=10, exclude_words=None):
    if not messages: return []
    if exclude_words is None: exclude_words = set()
    else: exclude_words = set(w.lower() for w in exclude_words)
    
    url_pattern = r'https?://\S+|www\.\S+'
    url_fragments = {'www', 'http', 'https', 'com', 'net', 'org', 'html', 'php', 'twitch', 'youtube', 'kick'}
    skip = STOP_WORDS | url_fragments | exclude_words
    
    texts = [re.sub(url_pattern, '', m['message'].lower()) for m in messages]
    all_text = " ".join(texts)
    
    words = re.findall(r"\b[a-z][a-z']{2,}\b", all_text)
    words = [w for w in words if w not in skip]
    word_freq = Counter(words)
    
    bigram_freq = Counter()
    for text in texts:
        toks = [w for w in re.findall(r"\b[a-z][a-z']{2,}\b", text) if w not in skip]
        for i in range(len(toks) - 1):
            bigram_freq[f"{toks[i]} {toks[i+1]}"] += 1
            
    scored = {}
    for word, count in word_freq.items():
        if count < 2: continue
        scored[word] = count * (1.5 if word in TOPIC_SIGNALS else 1.0)
    for bigram, count in bigram_freq.items():
        if count < 2: continue
        w1, w2 = bigram.split()
        scored[bigram] = count * (2.0 if (w1 in TOPIC_SIGNALS or w2 in TOPIC_SIGNALS) else 1.3)
        
    ranked = sorted(scored.items(), key=lambda x: x[1], reverse=True)
    final = []
    covered = set()
    for term, score in ranked:
        parts = set(term.split())
        if parts & covered: continue
        final.append((term, int(score)))
        covered.update(parts)
        if len(final) >= top_n: break
    return final

def analyse_sentiment_patterns(messages):
    if len(messages) < 3:
        return {"velocity": "stable", "intensity": "low", "engagement_pattern": "warming up", "top_user": "N/A", "top_message": "N/A", "delta": 0}
    
    total = len(messages)
    third = max(1, total // 3)
    early = messages[:third]
    recent = messages[-third:]
    
    def pos_ratio(msgs):
        if not msgs: return 0.5
        return sum(1 for m in msgs if m.get('sentiment') == 'good') / len(msgs)
        
    early_pos = pos_ratio(early)
    recent_pos = pos_ratio(recent)
    delta = recent_pos - early_pos
    
    velocity = "stable"
    if delta > 0.15: velocity = "rapidly improving"
    elif delta > 0.05: velocity = "slowly improving"
    elif delta < -0.15: velocity = "rapidly declining"
    elif delta < -0.05: velocity = "slowly declining"
    
    emotional = [m for m in messages if m.get('sentiment') != 'neutral']
    avg_conf = (sum(m.get('confidence', 0.7) for m in emotional) / len(emotional)) if emotional else 0.5
    
    intensity = "moderate"
    if avg_conf > 0.85: intensity = "very high"
    elif avg_conf > 0.75: intensity = "high"
    elif avg_conf < 0.65: intensity = "low"
    
    from collections import defaultdict
    user_scores = defaultdict(int)
    last_msgs = {} # user -> (msg, count)
    
    for m in messages:
        u = m.get('user', m.get('author', 'viewer'))
        txt = m.get('message', '').strip().lower()
        if not u or not txt: continue
        
        if u in last_msgs:
            l_txt, l_count = last_msgs[u]
            if txt == l_txt:
                last_msgs[u] = (txt, l_count + 1)
                # Penalize consecutive spam: after 3 repeats, stop giving points
                if l_count < 3:
                    user_scores[u] += 1
            else:
                last_msgs[u] = (txt, 1)
                user_scores[u] += 1
        else:
            last_msgs[u] = (txt, 1)
            user_scores[u] += 1
            
    most_active_user = max(user_scores.items(), key=lambda x: x[1])[0] if user_scores else "N/A"
    
    msg_counts = Counter([m['message'] for m in messages if len(m['message']) > 3])
    top_message = msg_counts.most_common(1)[0][0] if msg_counts else "N/A"
    
    all_users = [m.get('user', m.get('author', 'viewer')) for m in messages]
    unique_count = max(len(set(all_users)), 1)
    pattern = "mixed"
    if total / unique_count > 5: pattern = "dominated by few"
    elif total / unique_count < 2: pattern = "broad participation"
    else: pattern = "regular engagement"
    
    return {
        "velocity": velocity,
        "intensity": intensity,
        "engagement_pattern": pattern,
        "top_user": most_active_user,
        "top_message": top_message,
        "delta": round(delta * 100, 1)
    }

def generate_twitch_summary(messages):
    """Generate analytical summary for Twitch chat."""
    if len(messages) < 20:
        return "Not enough messages yet to generate a summary."
    keywords = extract_keywords(messages, top_n=8)
    keyword_list = [w for w, c in keywords]
    good_count = sum(1 for m in messages if m['sentiment'] == 'good')
    bad_count = sum(1 for m in messages if m['sentiment'] == 'bad')
    neutral_count = sum(1 for m in messages if m['sentiment'] == 'neutral')
    total = len(messages)
    summary_parts = []
    if good_count > total * 0.6:
        summary_parts.append("The chat atmosphere is overwhelmingly positive with viewers expressing enthusiasm and support.")
    elif bad_count > total * 0.4:
        summary_parts.append("There's notable negativity in the chat with viewers expressing frustration or criticism.")
    elif neutral_count > total * 0.6:
        summary_parts.append("Chat activity is relatively neutral with casual conversation and minimal strong reactions.")
    else:
        summary_parts.append("The chat shows mixed sentiment with varied viewer reactions.")
    if keyword_list:
        top_topics = ", ".join(keyword_list[:5])
        summary_parts.append(f"Main discussion topics include: {top_topics}.")
    if total > 100:
        summary_parts.append(f"High engagement with {total} messages analyzed.")
    elif total > 50:
        summary_parts.append(f"Moderate engagement with {total} messages.")
    else:
        summary_parts.append(f"Growing engagement with {total} messages so far.")
    return " ".join(summary_parts)

def generate_twitch_suggestions(messages, counts, channel=""):
    """Generate actionable streamer suggestions."""
    if len(messages) < 20:
        return {"suggestions": ["Need at least 20 messages to generate insights."], "note": "Keep the conversation going!"}
    suggestions = []
    total = sum(counts.values())
    if total == 0:
        return {"suggestions": ["No data available yet."], "note": "Waiting for chat activity..."}
    
    # Build exclude list from channel name
    exclude = set()
    if channel:
        exclude.add(channel.lower())
        for part in channel.lower().replace('_', ' ').replace('-', ' ').split():
            if len(part) >= 3: exclude.add(part)
    
    good_pct = (counts.get('good', 0) / total) * 100
    bad_pct = (counts.get('bad', 0) / total) * 100
    neutral_pct = (counts.get('neutral', 0) / total) * 100
    if good_pct > 70:
        suggestions.append(f"Excellent Performance: Chat sentiment is overwhelmingly positive ({round(good_pct, 1)}% positive). Keep it up!")
    elif good_pct > 50:
        suggestions.append(f"Strong Positive Response: Majority ({round(good_pct, 1)}% positive) are enjoying the stream.")
    elif bad_pct > 40:
        suggestions.append(f"High Negativity Alert: {round(bad_pct, 1)}% negative. Consider addressing viewer concerns.")
    elif bad_pct > 25:
        suggestions.append(f"Moderate Negativity: {round(bad_pct, 1)}% negative. Monitor chat for common complaints.")
    if neutral_pct > 70:
        suggestions.append(f"Low Engagement: {round(neutral_pct, 1)}% neutral. Try polls or Q&A to boost interaction.")
    
    # Improved complaints: only from bad messages, filter channel name + filler
    bad_messages = [m['message'].lower() for m in messages if m['sentiment'] == 'bad']
    if len(bad_messages) >= 5:
        complaint_keywords = Counter()
        url_pat = r'https?://\S+|www\.\S+'
        filler = {'this','that','what','when','where','why','how','they','there',
                  'just','like','dont','even','still','think','really','know',
                  'want','need','have','make','been','going','about','would',
                  'could','should','every','much','thing','stuff','your','with'}
        for msg in bad_messages:
            cleaned = re.sub(url_pat, '', msg)
            words = re.findall(r'\b[a-z]{4,}\b', cleaned)
            words = [w for w in words if w not in filler and w not in exclude and w not in STOP_WORDS]
            complaint_keywords.update(words)
        common_complaints = [(w, c) for w, c in complaint_keywords.most_common(8) if c >= 2]
        if common_complaints:
            complaint_terms = ", ".join([w for w, c in common_complaints[:3]])
            suggestions.append(f"Common Complaints: Viewers mention '{complaint_terms}'. Address these directly.")
    
    keywords = extract_keywords(messages, top_n=10, exclude_words=exclude)
    if keywords:
        suggestions.append(f"Trending Topic: '{keywords[0][0]}' is being discussed heavily.")
    if not suggestions:
        suggestions.append("Chat analysis: Sentiment appears balanced. Keep engaging naturally.")
    return {"suggestions": suggestions[:5], "note": f"Analysis based on {total} messages"}

def calculate_stream_score(counts, messages):
    """Calculate stream health score 0-100."""
    if not messages:
        return 50
    total = sum(counts.values())
    if total == 0:
        return 50
    positive_ratio = counts.get('good', 0) / total
    negative_ratio = counts.get('bad', 0) / total
    neutral_ratio = counts.get('neutral', 0) / total
    score = 50 + (positive_ratio * 50) - (negative_ratio * 40)
    engagement_bonus = min(10, len(messages) / 100)
    score += engagement_bonus
    if neutral_ratio > 0.7:
        score -= 10
    return max(0, min(100, int(score)))

# ===== IRC & CHAT CLIENTS (from VMAX) =====

class IRCChatClient:
    platform_name = "unknown"

    def __init__(self, channel: str, oauth_token: str = "", server: str = "irc.chat.twitch.tv", port: int = 6667):
        self.channel    = channel.lower().replace('#', '').strip()
        self.token      = oauth_token or "justinfan12345"
        self.server     = server
        self.port       = port
        self._sock      = None
        self.running    = False

    def connect(self):
        print(f"🔌 [{self.__class__.__name__}] Connecting #{self.channel}...")
        self._sock = socket.socket()
        self._sock.settimeout(30)
        self._sock.connect((self.server, self.port))
        username = f"justinfan{random.randint(10000, 99999)}"
        for line in [f"PASS oauth:{self.token}\n", f"NICK {username}\n", f"JOIN #{self.channel}\n"]:
            self._sock.send(line.encode('utf-8'))
        time.sleep(2)
        self.running = True
        print(f"✅ Connected as {username} → #{self.channel}")

    def read_messages(self):
        buf = ""
        while self.running:
            try:
                data = self._sock.recv(2048).decode('utf-8', errors='ignore')
                buf += data
                lines = buf.split('\r\n')
                buf = lines.pop()
                for line in lines:
                    if line.startswith('PING'):
                        self._sock.send(b"PONG :tmi.twitch.tv\n")
                        continue
                    if 'PRIVMSG' in line:
                        try:
                            # Handle tags if present (lines starting with @)
                            if line.startswith('@'):
                                # Format: @tags :user!host PRIVMSG #channel :message
                                parts = line.split(' ', 2)
                                # username is between : and ! in the second part
                                user = parts[1].split('!')[0].replace(':', '').strip()
                                msg = line.split('PRIVMSG', 1)[1].split(':', 1)[-1].strip()
                            else:
                                # Standard Format: :user!host PRIVMSG #channel :message
                                parts = line.split('PRIVMSG', 1)
                                user = parts[0].split('!')[0].replace(':', '').strip()
                                msg = parts[1].split(':', 1)[-1].strip()
                                
                            if user and msg and not detect_spam(msg):
                                self._process(user, msg)
                        except Exception as e:
                            print(f"⚠️ Parse error: {e}")
            except socket.timeout:
                continue
            except Exception as e:
                if self.running: print(f"❌ Read error: {e}")
                break

    def _process(self, username: str, message: str):
        if self.channel not in twitch_chat_buffers:
            twitch_chat_buffers[self.channel] = deque(maxlen=MAX_BUFFER_SIZE)
        buf = twitch_chat_buffers[self.channel]
        
        sentiment = classify_simple(message)
        message = transform_emotes(message)
        
        msg_obj = {
            "user": username,
            "time": datetime.now().strftime("%H:%M:%S"),
            "message": message,
            "sentiment": sentiment,
            "platform": self.platform_name,
        }
        buf.append(msg_obj)
        socketio.emit('new_message', msg_obj)

    def disconnect(self):
        self.running = False
        if self._sock:
            try: self._sock.close()
            except: pass
        self._sock = None

class TwitchIRCClient(IRCChatClient):
    platform_name = "twitch"
    def __init__(self, channel, oauth_token=""):
        super().__init__(channel, oauth_token, "irc.chat.twitch.tv", 6667)

class KickChatClient:
    """
    Kick chat via Pusher WebSocket.
    Resolves chatroom_id through 5 strategies for maximum reliability.
    """
    platform_name = "kick"
    PUSHER_URL = (
        "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679"
        "?protocol=7&client=js&version=7.6.0&flash=false"
    )
    CORS_PROXIES = [
        "https://api.allorigins.win/raw?url=",
        "https://corsproxy.io/?",
        "https://api.codetabs.com/v1/proxy?quest=",
    ]

    def __init__(self, channel: str):
        self.channel = channel.lower().strip()
        self.running = False
        self._ws = None
        self._chatroom_id = None
        self._manual_chatroom_id = None

    def connect(self):
        print(f"🔌 [KickChatClient] Resolving #{self.channel}...")
        strategies = [
            ("tls-client", self._try_tls_client),
            ("httpx HTTP/2", self._try_httpx),
            ("cloudscraper", self._try_cloudscraper),
            ("CORS proxy", self._try_cors_proxy),
            ("Selenium", self._try_selenium),
            ("manual fallback", self._try_manual_fallback),
        ]
        
        for name, fn in strategies:
            try:
                self._chatroom_id = fn()
                if self._chatroom_id:
                    print(f"  ✅ chatroom_id={self._chatroom_id} via {name}")
                    break
            except Exception as e:
                print(f"  ✗ {name}: {e}")
                
        if not self._chatroom_id:
            raise ConnectionError(f"Could not resolve Kick chat ID for {self.channel}")
        self.running = True

    def _kick_json(self, url, session=None):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://kick.com/",
        }
        r = (session or requests).get(url, headers=headers, timeout=10)
        return r.json() if r.status_code == 200 else None

    def _extract_cid(self, data):
        if not data: return None
        return (data.get("chatroom") or {}).get("id") or ((data.get("data") or {}).get("chatroom") or {}).get("id")

    def _try_tls_client(self):
        try:
            import tls_client
            session = tls_client.Session(client_identifier="chrome_120")
            url = f"https://kick.com/api/v2/channels/{self.channel}"
            return self._extract_cid(self._kick_json(url, session))
        except: return None

    def _try_httpx(self):
        try:
            import httpx
            with httpx.Client(http2=True, timeout=10) as client:
                url = f"https://kick.com/api/v2/channels/{self.channel}"
                return self._extract_cid(self._kick_json(url, client))
        except: return None

    def _try_cloudscraper(self):
        try:
            import cloudscraper
            session = cloudscraper.create_scraper()
            url = f"https://kick.com/api/v2/channels/{self.channel}"
            return self._extract_cid(self._kick_json(url, session))
        except: return None

    def _try_cors_proxy(self):
        import urllib.parse
        target = f"https://kick.com/api/v2/channels/{self.channel}"
        encoded = urllib.parse.quote(target)
        for proxy in self.CORS_PROXIES:
            try:
                r = requests.get(f"{proxy}{encoded}", timeout=10)
                if r.status_code == 200:
                    return self._extract_cid(r.json())
            except: pass
        return None

    def _try_selenium(self):
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            opts = Options()
            opts.add_argument("--headless")
            driver = webdriver.Chrome(options=opts)
            driver.get(f"https://kick.com/api/v2/channels/{self.channel}")
            time.sleep(3)
            import json
            data = json.loads(driver.find_element("tag name", "body").text)
            driver.quit()
            return self._extract_cid(data)
        except: return None

    def _try_manual_fallback(self):
        return self._manual_chatroom_id

    def read_messages(self):
        import websocket as ws_lib
        import json as _json

        def on_open(ws):
            sub = _json.dumps({
                "event": "pusher:subscribe",
                "data": {"auth": "", "channel": f"chatrooms.{self._chatroom_id}.v2"}
            })
            ws.send(sub)

        def on_message(ws, raw):
            if not self.running: ws.close(); return
            try:
                frame = _json.loads(raw)
                if frame.get("event") == "App\\Events\\ChatMessageEvent":
                    data = frame.get("data")
                    if isinstance(data, str): data = _json.loads(data)
                    user = data.get("sender", {}).get("username", "unknown")
                    msg = data.get("content", "")
                    msg = re.sub(r'\[emote:\d+:[^\]]+\]', '', msg).strip()
                    if msg and not detect_spam(msg):
                        self._process(user, msg)
            except: pass

        self._ws = ws_lib.WebSocketApp(self.PUSHER_URL, on_open=on_open, on_message=on_message)
        self._ws.run_forever(ping_interval=30)

    def _process(self, username, message):
        if self.channel not in kick_chat_buffers:
            kick_chat_buffers[self.channel] = deque(maxlen=MAX_BUFFER_SIZE)
        buf = kick_chat_buffers[self.channel]
        sentiment = classify_simple(message)
        message = transform_emotes(message)
        
        msg_obj = {
            "user": username,
            "time": datetime.now().strftime("%H:%M:%S"),
            "message": message,
            "sentiment": sentiment,
            "platform": self.platform_name,
        }
        buf.append(msg_obj)
        socketio.emit('new_message', msg_obj)

    def disconnect(self):
        self.running = False
        if self._ws: self._ws.close()

    def _try_cors_proxy(self):
        import urllib.parse
        target = f"https://kick.com/api/v2/channels/{self.channel}"
        encoded = urllib.parse.quote(target, safe="")
        for proxy in self.CORS_PROXIES:
            try:
                r = requests.get(f"{proxy}{encoded}", timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    if "contents" in data:
                        data = json.loads(data["contents"])
                    cid = self._extract_cid(data)
                    if cid:
                        print(f"    ✓ proxy OK: {proxy[:40]}")
                        return cid
            except Exception as e:
                print(f"    ✗ proxy {proxy[:30]}: {e}")
        return None

    def _try_manual_fallback(self):
        if self._manual_chatroom_id:
            print(f"    ✓ using manual chatroom_id={self._manual_chatroom_id}")
            return self._manual_chatroom_id
        return None

    def read_messages(self):
        try:
            import websocket as ws_lib
        except ImportError:
            print("❌ websocket-client not installed. Run: pip install websocket-client")
            return

        def on_open(ws):
            sub = json.dumps({
                "event": "pusher:subscribe",
                "data": {"auth": "", "channel": f"chatrooms.{self._chatroom_id}.v2"}
            })
            ws.send(sub)
            print(f"✅ Pusher subscribed to chatrooms.{self._chatroom_id}.v2 (#{self.channel})")

        def on_message(ws, raw):
            if not self.running:
                ws.close()
                return
            try:
                frame = json.loads(raw)
                event = frame.get("event", "")

                if event == "pusher:ping":
                    ws.send(json.dumps({"event": "pusher:pong", "data": {}}))
                    return

                if event == "App\\Events\\ChatMessageEvent":
                    payload = frame.get("data", {})
                    if isinstance(payload, str):
                        payload = json.loads(payload)

                    username = payload.get("sender", {}).get("username", "unknown")
                    content = payload.get("content", "")
                    # Strip Kick emote codes like [emote:123:name]
                    content = re.sub(r'\[emote:\d+:[^\]]+\]', '', content).strip()

                    if content and not detect_spam(content):
                        self.process_message(username, content)

            except Exception as e:
                print(f"⚠️ Kick parse error: {e}")

        def on_error(ws, error):
            if self.running:
                print(f"❌ Kick WS error: {error}")

        def on_close(ws, code, msg):
            print(f"🔌 Kick WS closed ({code})")
            if self.running:
                print(f"🔄 Kick #{self.channel} reconnecting in 5s...")
                time.sleep(5)
                if self.running:
                    self.read_messages()

        self._ws = ws_lib.WebSocketApp(
            self.PUSHER_URL,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close,
        )
        self._ws.run_forever(ping_interval=30, ping_timeout=10)

    def process_message(self, username, message):
        sentiment = classify_simple(message)
        msg_obj = {
            "user": username,
            "time": datetime.now().strftime("%H:%M:%S"),
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "sentiment": sentiment,
            "author": username,
            "platform": "kick"
        }
        if self.channel not in kick_chat_buffers:
            kick_chat_buffers[self.channel] = deque(maxlen=MAX_BUFFER_SIZE)
        kick_chat_buffers[self.channel].append(msg_obj)
        socketio.emit('kick_message', msg_obj)
        print(f"💬 [KICK] {username}: {message[:60]}")

    def disconnect(self):
        self.running = False
        if self._ws:
            try:
                self._ws.close()
            except:
                pass
        self._ws = None
        print(f"🔌 Kick #{self.channel} disconnected")

# ===== TWITCH ROUTES =====
@app.route("/api/twitch/connect", methods=["POST"])
def twitch_connect():
    data = request.json
    channel = data.get("channel", "").lower().strip()
    if not channel:
        return jsonify({"error": "Channel name required"}), 400
    if channel in active_twitch_connections:
        active_twitch_connections[channel].disconnect()
    try:
        client = TwitchIRCClient(channel)
        client.connect()
        
        # Pre-load recent messages for Twitch
        try:
            print(f"Pre-loading recent messages for Twitch #{channel}...")
            history_url = f"https://recent-messages.robotty.de/api/v2/recent-messages/{channel}?limit=100"
            h_res = requests.get(history_url, timeout=8)
            if h_res.status_code == 200:
                h_data = h_res.json()
                recent_msgs = h_data.get("messages", [])
                if channel not in twitch_chat_buffers:
                    twitch_chat_buffers[channel] = deque(maxlen=MAX_BUFFER_SIZE)
                
                loaded = 0
                for rm in recent_msgs:
                    line = rm
                    if 'PRIVMSG' in line:
                        try:
                            if line.startswith('@'):
                                parts = line.split(' ', 2)
                                user = parts[1].split('!')[0].replace(':', '').strip()
                                msg = line.split('PRIVMSG', 1)[1].split(':', 1)[-1].strip()
                            else:
                                parts = line.split('PRIVMSG', 1)
                                user = parts[0].split('!')[0].replace(':', '').strip()
                                msg = parts[1].split(':', 1)[-1].strip()
                                
                            if user and msg and not detect_spam(msg):
                                msg = transform_emotes(msg)
                                sentiment = classify_simple(msg)
                                msg_obj = {
                                    "user": user,
                                    "time": datetime.now().strftime("%H:%M:%S"),
                                    "timestamp": datetime.now().isoformat(),
                                    "message": msg,
                                    "sentiment": sentiment,
                                    "author": user,
                                    "platform": "twitch"
                                }
                                twitch_chat_buffers[channel].append(msg_obj)
                                loaded += 1
                        except Exception as e:
                            pass
                print(f"✅ Pre-loaded {loaded}/{len(recent_msgs)} messages for Twitch #{channel}")
        except Exception as e:
            print(f"Twitch pre-loading failed: {e}")

        thread = threading.Thread(target=client.read_messages, daemon=True)
        thread.start()
        active_twitch_connections[channel] = client
        return jsonify({"success": True, "channel": channel, "message": f"Connected to #{channel} with pre-loaded history"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/twitch/disconnect/<channel>", methods=["POST"])
def twitch_disconnect(channel):
    channel = channel.lower()
    if channel in active_twitch_connections:
        active_twitch_connections[channel].disconnect()
        del active_twitch_connections[channel]
        return jsonify({"success": True, "message": f"Disconnected from #{channel}"})
    return jsonify({"error": "Not connected to this channel"}), 404

@app.route("/api/twitch/messages/<channel>", methods=["GET"])
def twitch_messages(channel):
    channel = channel.lower()
    if channel not in twitch_chat_buffers:
        return jsonify({"messages": [], "counts": {"good": 0, "bad": 0, "neutral": 0}})
    messages = list(twitch_chat_buffers[channel])
    counts = {
        "good": sum(1 for m in messages if m['sentiment'] == 'good'),
        "bad": sum(1 for m in messages if m['sentiment'] == 'bad'),
        "neutral": sum(1 for m in messages if m['sentiment'] == 'neutral')
    }
    return jsonify({"messages": messages, "counts": counts, "total": len(messages)})

@app.route("/api/twitch/analytics/<channel>", methods=["GET"])
def twitch_analytics(channel):
    channel = channel.lower()
    if channel not in twitch_chat_buffers:
        return jsonify({"total_messages": 0, "counts": {"good": 0, "bad": 0, "neutral": 0}, "mood": "Waiting for chat...", "keywords": [], "stream_score": 50, "top_user": "N/A", "top_chat": "N/A", "summary": "Waiting for messages...", "patterns": {}, "percentages": {"good": 0, "bad": 0, "neutral": 0}})
    messages = list(twitch_chat_buffers[channel])
    if not messages:
        return jsonify({"total_messages": 0, "counts": {"good": 0, "bad": 0, "neutral": 0}, "mood": "Waiting for chat...", "keywords": [], "stream_score": 50, "top_user": "N/A", "top_chat": "N/A", "summary": "Waiting for messages...", "patterns": {}, "percentages": {"good": 0, "bad": 0, "neutral": 0}})
    counts = {
        "good": sum(1 for m in messages if m['sentiment'] == 'good'),
        "bad": sum(1 for m in messages if m['sentiment'] == 'bad'),
        "neutral": sum(1 for m in messages if m['sentiment'] == 'neutral')
    }
    total = len(messages)
    percentages = {
        "good": round((counts['good'] / total) * 100, 1) if total > 0 else 0,
        "bad": round((counts['bad'] / total) * 100, 1) if total > 0 else 0,
        "neutral": round((counts['neutral'] / total) * 100, 1) if total > 0 else 0
    }
    g, b, n = percentages.get('good', 0), percentages.get('bad', 0), percentages.get('neutral', 0)
    mood = calculate_stream_mood(messages)
    exclude = {channel}
    for part in channel.replace('_', ' ').replace('-', ' ').split():
        if len(part) >= 3: exclude.add(part)
    keywords = extract_keywords(messages, top_n=10, exclude_words=exclude)
    score = calculate_stream_score(counts, messages)
    patterns = analyse_sentiment_patterns(messages)
    
    return jsonify({
        "counts": counts,
        "percentages": percentages,
        "mood": mood,
        "keywords": keywords,
        "stream_score": score,
        "total_messages": total,
        "summary": summarize(counts),
        "patterns": patterns,
        "velocity": patterns.get("velocity", "stable"),
        "intensity": patterns.get("intensity", "moderate"),
        "engagement_pattern": patterns.get("engagement_pattern", "regular"),
        "top_user": patterns.get("top_user", "N/A"),
        "top_chat": patterns.get("top_message", "N/A"),
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/twitch/summary/<channel>", methods=["GET"])
def twitch_summary(channel):
    channel = channel.lower()
    if channel not in twitch_chat_buffers:
        return jsonify({"error": "No data available"}), 404
    messages = list(twitch_chat_buffers[channel])
    summary = generate_twitch_summary(messages)
    return jsonify({"summary": summary, "message_count": len(messages)})

@app.route("/api/twitch/suggestions/<channel>", methods=["GET"])
def twitch_suggestions(channel):
    channel = channel.lower()
    if channel not in twitch_chat_buffers:
        return jsonify({"suggestions": ["Waiting for chat messages..."], "note": "Connect to a stream to start analysis"})
    messages = list(twitch_chat_buffers[channel])
    counts = {
        "good": sum(1 for m in messages if m['sentiment'] == 'good'),
        "bad": sum(1 for m in messages if m['sentiment'] == 'bad'),
        "neutral": sum(1 for m in messages if m['sentiment'] == 'neutral')
    }
    suggestions = generate_twitch_suggestions(messages, counts, channel)
    return jsonify(suggestions)

# ===== KICK ROUTES =====
@app.route("/api/kick/connect", methods=["POST"])
def kick_connect():
    data = request.json
    channel = data.get("channel", "").lower().strip()
    if not channel:
        return jsonify({"error": "Channel name required"}), 400
    if channel in active_kick_connections:
        active_kick_connections[channel].disconnect()
    try:
        client = KickChatClient(channel)
        manual_cid = data.get("chatroom_id")
        if manual_cid:
            try:
                client._manual_chatroom_id = int(manual_cid)
            except (ValueError, TypeError):
                pass
        client.connect()
        
        # Pre-load 50 recent messages for Kick
        try:
            print(f"Pre-loading recent messages for Kick #{channel}...")
            # Kick v2 messages endpoint
            # We can use the same strategies as chatroom_id resolution
            history_url = f"https://kick.com/api/v2/channels/{channel}/messages"
            # Using the client's internal session or helper to fetch history
            h_data = client._kick_json(history_url)
            if h_data and "messages" in h_data:
                msgs = h_data["messages"]
                if channel not in kick_chat_buffers:
                    kick_chat_buffers[channel] = deque(maxlen=MAX_BUFFER_SIZE)
                
                for km in msgs:
                    user = km.get("sender", {}).get("username", "unknown")
                    content = km.get("content", "")
                    content = re.sub(r'\[emote:\d+:[^\]]+\]', '', content).strip()
                    if content and not detect_spam(content):
                        content = transform_emotes(content)
                        sentiment = classify_simple(content)
                        intent = get_msg_intent(content)
                        msg_obj = {
                            "user": user,
                            "time": datetime.now().strftime("%H:%M:%S"),
                            "timestamp": datetime.now().isoformat(),
                            "message": content,
                            "sentiment": sentiment,
                            "intent": intent,
                            "author": user,
                            "platform": "kick"
                        }
                        kick_chat_buffers[channel].append(msg_obj)
                print(f"Pre-loaded {len(msgs)} messages for Kick #{channel}")
        except Exception as e:
            print(f"Kick pre-loading failed: {e}")

        thread = threading.Thread(target=client.read_messages, daemon=True)
        thread.start()
        active_kick_connections[channel] = client
        return jsonify({"success": True, "channel": channel, "message": f"Connected to Kick #{channel} with pre-loaded history"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/kick/disconnect/<channel>", methods=["POST"])
def kick_disconnect(channel):
    channel = channel.lower()
    if channel in active_kick_connections:
        active_kick_connections[channel].disconnect()
        del active_kick_connections[channel]
        if channel in kick_chat_buffers:
            del kick_chat_buffers[channel]
        return jsonify({"success": True, "message": f"Disconnected from Kick #{channel}"})
    return jsonify({"error": "Not connected to this channel"}), 404

@app.route("/api/kick/messages/<channel>", methods=["GET"])
def kick_messages(channel):
    channel = channel.lower()
    if channel not in kick_chat_buffers:
        return jsonify({"messages": [], "counts": {"good": 0, "bad": 0, "neutral": 0}})
    messages = list(kick_chat_buffers[channel])
    counts = {
        "good": sum(1 for m in messages if m['sentiment'] == 'good'),
        "bad": sum(1 for m in messages if m['sentiment'] == 'bad'),
        "neutral": sum(1 for m in messages if m['sentiment'] == 'neutral')
    }
    return jsonify({"messages": messages, "counts": counts, "total": len(messages)})

@app.route("/api/kick/analytics/<channel>", methods=["GET"])
def kick_analytics(channel):
    channel = channel.lower()
    if channel not in kick_chat_buffers:
        return jsonify({"total_messages": 0, "counts": {"good": 0, "bad": 0, "neutral": 0}, "mood": "Waiting for chat...", "keywords": [], "stream_score": 50, "top_user": "N/A", "top_chat": "N/A", "summary": "Waiting for messages...", "patterns": {}, "percentages": {"good": 0, "bad": 0, "neutral": 0}})
    messages = list(kick_chat_buffers[channel])
    if not messages:
        return jsonify({"total_messages": 0, "counts": {"good": 0, "bad": 0, "neutral": 0}, "mood": "Waiting for chat...", "keywords": [], "stream_score": 50, "top_user": "N/A", "top_chat": "N/A", "summary": "Waiting for messages...", "patterns": {}, "percentages": {"good": 0, "bad": 0, "neutral": 0}})
    counts = {
        "good": sum(1 for m in messages if m['sentiment'] == 'good'),
        "bad": sum(1 for m in messages if m['sentiment'] == 'bad'),
        "neutral": sum(1 for m in messages if m['sentiment'] == 'neutral')
    }
    total = len(messages)
    percentages = {
        "good": round((counts['good'] / total) * 100, 1) if total > 0 else 0,
        "bad": round((counts['bad'] / total) * 100, 1) if total > 0 else 0,
        "neutral": round((counts['neutral'] / total) * 100, 1) if total > 0 else 0
    }
    mood = calculate_stream_mood(messages)
    exclude = {channel}
    for part in channel.replace('_', ' ').replace('-', ' ').split():
        if len(part) >= 3: exclude.add(part)
    keywords = extract_keywords(messages, top_n=10, exclude_words=exclude)
    score = calculate_stream_score(counts, messages)
    patterns = analyse_sentiment_patterns(messages)
    
    return jsonify({
        "counts": counts,
        "percentages": percentages,
        "mood": mood,
        "keywords": keywords,
        "stream_score": score,
        "total_messages": total,
        "summary": summarize(counts),
        "patterns": patterns,
        "velocity": patterns.get("velocity", "stable"),
        "intensity": patterns.get("intensity", "moderate"),
        "engagement_pattern": patterns.get("engagement_pattern", "regular"),
        "top_user": patterns.get("top_user", "N/A"),
        "top_chat": patterns.get("top_message", "N/A"),
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/kick/summary/<channel>", methods=["GET"])
def kick_summary(channel):
    channel = channel.lower()
    if channel not in kick_chat_buffers:
        return jsonify({"error": "No data available"}), 404
    messages = list(kick_chat_buffers[channel])
    summary = generate_twitch_summary(messages)
    return jsonify({"summary": summary, "message_count": len(messages)})

@app.route("/api/kick/suggestions/<channel>", methods=["GET"])
def kick_suggestions(channel):
    channel = channel.lower()
    if channel not in kick_chat_buffers:
        return jsonify({"error": "No data available"}), 404
    messages = list(kick_chat_buffers[channel])
    counts = {
        "good": sum(1 for m in messages if m['sentiment'] == 'good'),
        "bad": sum(1 for m in messages if m['sentiment'] == 'bad'),
        "neutral": sum(1 for m in messages if m['sentiment'] == 'neutral')
    }
    suggestions = generate_twitch_suggestions(messages, counts, channel)
    return jsonify(suggestions)

# ===== WEBSOCKET HANDLERS =====
@socketio.on('connect')
def handle_ws_connect():
    print("WebSocket client connected")
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_ws_disconnect():
    print("WebSocket client disconnected")

# Serve Next.js static files - CATCH ALL (must be at the bottom)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting StreamSift backend on port {port} — YouTube + Twitch + Kick")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
