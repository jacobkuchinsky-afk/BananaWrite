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

# Configure CORS - allow all origins
# supports_credentials allows cookies/auth if needed
CORS(app, 
     origins="*",
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)


# Error handler to ensure CORS headers on errors
@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions with proper CORS headers"""
    response = jsonify({
        "error": str(e),
        "type": type(e).__name__
    })
    response.status_code = 500
    return response


# Register blueprints
app.register_blueprint(prompt_bp)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Railway deployment"""
    # Check if API key is configured
    api_key = os.getenv('CHUTES_API_KEY', '')
    has_api_key = len(api_key) > 10 if api_key else False
    
    return jsonify({
        "status": "healthy",
        "service": "bananawrite-backend",
        "version": "1.0.0",
        "api_key_configured": has_api_key,
        "api_key_preview": f"{api_key[:8]}..." if has_api_key else "NOT SET"
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





