const apiKey = document.getElementById("apiKey");
const url = document.getElementById("url");
const mode = document.getElementById("mode");
const commentsEl = document.getElementById("comments");
const summaryEl = document.getElementById("summary");
const videoInfoEl = document.getElementById("videoInfo");
const staticLimit = document.getElementById("staticLimit");
const liveRate = document.getElementById("liveRate");
const liveSummaryBtn = document.getElementById("liveSummaryBtn");
const liveGraphBtn = document.getElementById("liveGraphBtn");

let pieChart = null;
let lineChart = null;

let liveTotals = { good: 0, bad: 0, neutral: 0 };
let timeline = { good: [], bad: [], neutral: [] };
let pageToken = null;
let liveChatId = null;
let liveActive = false;

// Load saved API key
apiKey.value = localStorage.getItem("YT_KEY") || "";
apiKey.onchange = () => localStorage.setItem("YT_KEY", apiKey.value);

// Toggle controls based on mode
mode.onchange = () => {
  staticLimit.style.display = mode.value === "static" ? "inline-block" : "none";
  liveRate.style.display = mode.value === "live" ? "inline-block" : "none";
  liveSummaryBtn.style.display = mode.value === "live" ? "block" : "none";
  liveGraphBtn.style.display = mode.value === "live" ? "block" : "none";
};

function videoIdFromUrl(u) {
  const m = u.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return m ? m[1] : null;
}

function addComment(c) {
  const p = document.createElement("p");
  p.className = c.sentiment;
  p.innerText = c.text;
  commentsEl.appendChild(p);
}

function renderPie(counts) {
  const ctx = document.getElementById("pieChart");
  if (pieChart) pieChart.destroy();
  
  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["😊 Good", "😡 Bad", "😐 Neutral"],
      datasets: [{
        data: [counts.good, counts.bad, counts.neutral],
        backgroundColor: ['#7cffb2', '#ff7c7c', '#ffd966'],
        borderColor: '#0a0a0f',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#eee', font: { size: 12 } },
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Sentiment Distribution',
          color: '#7cffb2',
          font: { size: 16, weight: 'bold' }
        }
      }
    }
  });
}

function renderLine(counts) {
  const ctx = document.getElementById("lineChart");
  if (lineChart) lineChart.destroy();
  
  const total = counts.good + counts.bad + counts.neutral;
  const goodPct = total ? ((counts.good / total) * 100).toFixed(1) : 0;
  const badPct = total ? ((counts.bad / total) * 100).toFixed(1) : 0;
  const neutralPct = total ? ((counts.neutral / total) * 100).toFixed(1) : 0;
  
  lineChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [{
        label: "Percentage",
        data: [goodPct, badPct, neutralPct],
        backgroundColor: ['rgba(124, 255, 178, 0.7)', 'rgba(255, 124, 124, 0.7)', 'rgba(255, 217, 102, 0.7)'],
        borderColor: ['#7cffb2', '#ff7c7c', '#ffd966'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Sentiment Breakdown (%)',
          color: '#7cffb2',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { 
            color: '#eee',
            callback: (value) => value + '%'
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
          ticks: { color: '#eee' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

function renderLineTimeline() {
  const ctx = document.getElementById("lineChart");
  if (lineChart) lineChart.destroy();
  
  const labels = timeline.good.map((_, i) => `Poll ${i + 1}`);
  
  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Positive %",
          data: timeline.good,
          borderColor: '#7cffb2',
          backgroundColor: 'rgba(124, 255, 178, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: "Negative %",
          data: timeline.bad,
          borderColor: '#ff7c7c',
          backgroundColor: 'rgba(255, 124, 124, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: "Neutral %",
          data: timeline.neutral,
          borderColor: '#ffd966',
          backgroundColor: 'rgba(255, 217, 102, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#eee', font: { size: 12 } },
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Live Sentiment Timeline',
          color: '#7cffb2',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { 
            color: '#eee',
            callback: (value) => value + '%'
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
          ticks: { color: '#eee' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

async function loadVideoInfo(id) {
  try {
    const r = await fetch("/video-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey.value, video_id: id })
    });
    const d = await r.json();
    videoInfoEl.innerHTML = `
      <b>🎥 ${d.title}</b><br>
      <span style="opacity:0.8;">
        👁️ ${parseInt(d.views).toLocaleString()} views | 
        👍 ${parseInt(d.likes).toLocaleString()} likes | 
        💬 ${parseInt(d.comments).toLocaleString()} comments | 
        📅 ${new Date(d.published).toLocaleDateString()}
      </span>
    `;
  } catch (e) {
    console.error("Video info error:", e);
  }
}

async function analyze() {
  const id = videoIdFromUrl(url.value);
  if (!id) return alert("❌ Invalid YouTube URL");
  if (!apiKey.value) return alert("❌ Please enter your API key");

  commentsEl.innerHTML = '<p class="loading">Loading comments</p>';
  summaryEl.innerText = "Analyzing...";

  await loadVideoInfo(id);

  if (mode.value === "static") {
    try {
      const r = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey.value,
          video_id: id,
          limit: staticLimit.value
        })
      });

      if (!r.ok) throw new Error("Analysis failed");

      const d = await r.json();

      commentsEl.innerHTML = "";
      d.comments.forEach(addComment);
      summaryEl.innerText = d.summary;
      renderPie(d.counts);
      renderLine(d.counts);
    } catch (e) {
      commentsEl.innerHTML = `<p style="color:#ff7c7c;">❌ Error: ${e.message}</p>`;
      console.error(e);
    }
  } else {
    startLive(id);
  }
}

async function startLive(id) {
  try {
    const r = await fetch("/get-live-chat-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey.value, video_id: id })
    });
    const d = await r.json();
    
    if (d.error) {
      commentsEl.innerHTML = `<p style="color:#ff7c7c;">❌ ${d.error}</p>`;
      return;
    }

    liveChatId = d.liveChatId;
    liveTotals = { good: 0, bad: 0, neutral: 0 };
    timeline = { good: [], bad: [], neutral: [] };
    pageToken = null;
    liveActive = true;

    liveSummaryBtn.style.display = "block";
    liveGraphBtn.style.display = "block";

    if (liveRate.value !== "manual") pollLive();
  } catch (e) {
    commentsEl.innerHTML = `<p style="color:#ff7c7c;">❌ Error: ${e.message}</p>`;
    console.error(e);
  }
}

async function pollLive() {
  if (!liveActive) return;

  try {
    const r = await fetch("/analyze-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey.value,
        liveChatId,
        pageToken
      })
    });
    const d = await r.json();

    pageToken = d.nextPageToken;
    d.messages.forEach(addComment);

    liveTotals.good += d.counts.good;
    liveTotals.bad += d.counts.bad;
    liveTotals.neutral += d.counts.neutral;

    const total = liveTotals.good + liveTotals.bad + liveTotals.neutral;
    timeline.good.push(total ? (liveTotals.good / total) * 100 : 0);
    timeline.bad.push(total ? (liveTotals.bad / total) * 100 : 0);
    timeline.neutral.push(total ? (liveTotals.neutral / total) * 100 : 0);

    const delay = parseInt(liveRate.value) * 1000;
    setTimeout(pollLive, delay);
  } catch (e) {
    console.error("Live poll error:", e);
  }
}

function updateLiveGraph() {
  renderPie(liveTotals);
  renderLineTimeline();
}

function updateLiveSummary() {
  summaryEl.innerText = summarizeLive();
}

function summarizeLive() {
  if (liveTotals.good > liveTotals.bad) 
    return "🎉 Live chat is mostly positive - viewers are excited and engaged!";
  if (liveTotals.bad > liveTotals.good) 
    return "😔 Live chat shows frustration - many critical or unhappy viewers.";
  return "🤔 Live chat reactions are mixed - a balance of opinions.";
}