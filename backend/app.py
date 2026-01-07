"""
BananaWrite Flask Backend
Main application entry point
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from routes.prompt import prompt_bp

# Create Flask app
app = Flask(__name__)

# Configure CORS - restrict to allowed origins
# Add your Vercel domain here after deployment
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your Vercel domain below after deployment, e.g.:
    # "https://bananawrite.vercel.app",
    # "https://your-custom-domain.com",
]

# In production, use environment variable for additional origins
extra_origins = os.getenv('CORS_ALLOWED_ORIGINS', '')
if extra_origins:
    ALLOWED_ORIGINS.extend([origin.strip() for origin in extra_origins.split(',') if origin.strip()])

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# Register blueprints
app.register_blueprint(prompt_bp)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Railway deployment"""
    return jsonify({
        "status": "healthy",
        "service": "bananawrite-backend",
        "version": "1.0.0"
    })


@app.route('/', methods=['GET'])
def root():
    """Root endpoint - basic info"""
    return jsonify({
        "name": "BananaWrite API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "generate_prompt": "POST /api/generate-prompt",
            "writing_techniques": "GET /api/writing-techniques",
            "technique_by_index": "GET /api/technique/<index>"
        }
    })


if __name__ == '__main__':
    # Development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )





