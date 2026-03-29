import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.append(backend_dir)

# Import the Flask app from backend/app.py
# Note: we use 'from app import app' because we added 'backend' to sys.path
from app import app

if __name__ == "__main__":
    # Get port from environment variable for Render
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
