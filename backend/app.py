"""
BananaWrite Flask Backend
Main application entry point
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from routes.prompt import prompt_bp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Limit request size to 1MB to prevent DoS
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1MB

# Get allowed origins from environment (comma-separated) or use defaults
# Include both production and localhost for development
default_origins = 'https://bananawrite.com,https://www.bananawrite.com,https://banana-write.vercel.app,https://bananawrite.vercel.app,http://localhost:3000'
cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', default_origins).split(',')
# Strip whitespace from origins
cors_origins = [origin.strip() for origin in cors_origins]

logger.info(f"CORS allowed origins: {cors_origins}")

# Configure CORS with specific origins
CORS(app, 
     origins=cors_origins,
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)


# Error handler to ensure CORS headers on errors
@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions with proper CORS headers"""
    logger.error(f"Unhandled exception: {type(e).__name__}: {str(e)}")
    
    # Don't expose internal error details to clients
    response = jsonify({
        "error": "An internal error occurred",
        "type": "ServerError"
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
        "api_key_configured": has_api_key
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
    # Development server - debug mode controlled by environment
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=debug_mode
    )





