<p align="center">
  <img src="public/favicon.png" alt="StreamSift Logo" width="120" />
</p>

<h1 align="center">StreamSift</h1>

<p align="center">
  <strong>Understand Your Audience. Instantly.</strong>
</p>

<p align="center">
  Real-time audience intelligence tool for streamers and content creators.<br/>
  Get instant clarity on your audience engagement with AI-powered sentiment analysis.
</p>

---

## ✨ Features

- **Real-time Live Chat Analysis** – Monitor live stream chat sentiment as it happens for **YouTube**, **Twitch**, and **Kick**.
- **Platform Auto-Detection** – Just paste a URL; the app automatically detects if it's YouTube, Twitch, or Kick.
- **AI Insights & Suggestions** – Get intelligence on your stream performance with AI-generated suggestions for all platforms.
- **Dynamic Sentiment Summaries** – Nuanced, real-time summaries of the audience mood (e.g., "Overwhelmingly positive", "Vocal negativity").
- **Historical Message Preloading** – Fetches the last 30-40 messages on connection to give immediate sentiment context.
- **Static Video Analysis** – Analyze historical comments on any YouTube video for deep-dive sentiment breakdown.
- **AI-Powered Sentiment Classification** – Advanced BERT/RoBERTa engine with context-awareness, slang expansion, and sarcasm detection.
- **FLAN-T5 Powered Insights** – Generative AI suggestions and analytical summaries for real-time stream performance.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | React framework with App Router |
| **Tailwind CSS** | 3.x | Design and styling |
| **Lucide React** | - | Iconography |

### Backend
| Technology | Purpose |
|------------|---------|
| **Flask** | REST API & WebSocket server |
| **Transformers (HuggingFace)**| BERT/RoBERTa & FLAN-T5 model loading |
| **PyTorch** | Deep Learning backend engine |
| **Google Generative AI**| Gemini-powered heavy batch classification |
| **WebSocket** | Real-time chat integration for Kick & Twitch |

### Machine Learning
- **Sentiment Model** – BERT-based RoBERTa (`TransModelSimpRoberta2`)
- **Suggestion Engine** – FLAN-T5 model for generative insights
- **3-Class Classification** – Good (positive), Neutral, Bad (negative)

---

## 📁 Project Structure

```
streamsift/
├── app/                          # Next.js App Router
│   ├── analyze/                  # Analysis page
│   │   └── page.tsx
│   ├── services/                 # API service layer
│   │   └── api.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── Features.tsx
│   ├── FloatingIcons.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   └── Navigation.tsx
│
├── backend/                      # Flask backend
│   ├── app.py                    # Main API server
│   ├── requirements.txt          # Python dependencies
│   ├── templates/                # Flask templates
│   ├── static/                   # Static assets
│   └── *.sav, *.pkl              # ML model files
│
├── public/                       # Static assets
│   ├── favicon.png
│   └── images/
│
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **YouTube Data API Key** (get from [Google Cloud Console](https://console.cloud.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/streamsift.git
cd streamsift
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data (first time only)
python -c "import nltk; nltk.download('punkt')"

# Start Flask server
python app.py
```

The backend API will be available at `http://localhost:5000`

### 4. ML Model Setup

Place the following model files in the `backend/` directory:
- `yt_ai_classifier_model_2.sav` – Trained classifier
- `tfidf_vectorizer.sav` – TF-IDF vectorizer

> **Note:** Update the paths in `backend/app.py` if your model files are in a different location.

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video-info` | POST | Get video metadata (title, views, likes, comments) |
| `/analyze` | POST | Analyze static video comments with ML model |
| `/get-live-chat-id` | POST | Get live chat ID for a live stream |
| `/analyze-live` | POST | Analyze live chat messages in real-time |
| `/health` | GET | Health check endpoint |

### Example Request

```bash
curl -X POST http://localhost:5000/video-info \
  -H "Content-Type: application/json" \
  -d '{"video_id": "dQw4w9WgXcQ", "api_key": ""}'
```

---

## 🎮 Usage

1. **Start both servers** (frontend and backend)
2. **Navigate** to `http://localhost:3000`
3. **Click "Get Started"** or go to `/analyze`
4. **Enter a YouTube URL** (video or live stream)
5. **Select YouTube** as the platform
6. **Click "Analyze my Stream"**

### For Live Streams
- The app will automatically detect if it's a live stream
- Live chat messages will be polled every 2 seconds
- Sentiment is analyzed in real-time with auto-scrolling chat

### For Regular Videos
- Comments are fetched and analyzed using the ML model
- Displays sentiment breakdown and individual comment sentiments

---

## 🔐 Environment Configuration

The YouTube API key is currently hardcoded in `backend/app.py`. For production, use environment variables:

```bash
# Create .env file
echo "YOUTUBE_API_KEY=your_api_key_here" > backend/.env
```

---

## 🗺️ Roadmap

- [x] YouTube live stream support
- [x] YouTube static video analysis
- [x] Real-time sentiment dashboard
- [ ] Twitch integration
- [ ] Kick integration

- [ ] Historical analytics & trends
- [ ] Custom ML model training interface

---

## 📄 License

This project is for educational and personal use.

---

## 🙏 Acknowledgments

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [scikit-learn](https://scikit-learn.org/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<p align="center">
  Made with ❤️ for content creators
</p>
