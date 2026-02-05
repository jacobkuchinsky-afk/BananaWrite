"""
BananaWrite Flask Backend
Main application entry point
"""

import os
import logging
from flask import Flask, jsonify, request
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
     resources={r"/api/*": {"origins": cors_origins}},
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     expose_headers=["Content-Type"],
     supports_credentials=True)


# Add CORS headers to all responses (backup for streaming/error responses)
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in cors_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
    return response


# Error handler to ensure CORS headers on errors
@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions with proper CORS headers"""
    import traceback as _traceback
    full_traceback = _traceback.format_exc()
    
    logger.error(f"Unhandled exception: {type(e).__name__}: {str(e)}")
    logger.error(f"Full traceback: {full_traceback}")
    
    # #region agent log - TEMPORARILY expose full error details for debugging Chutes API issue
    response = jsonify({
        "error": "An internal error occurred",
        "type": "ServerError",
        "_debug_error_type": type(e).__name__,
        "_debug_error_msg": str(e),
        "_debug_traceback": full_traceback,
        "_debug_error_args": str(e.args) if hasattr(e, 'args') else None
    })
    # #endregion
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


@app.route('/api/test-model', methods=['GET'])
def test_model():
    """Test endpoint to check Chutes API model response - for debugging"""
    from services.ai_service import create_client, MAIN_MODEL, SELF_REVIEWER_MODEL, FAST_MODEL, BASE_URL, API_KEY
    
    try:
        client = create_client()
        
        # Simple test request
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "user", "content": "Say exactly: Hello, the model is working correctly."}
            ],
            max_tokens=50,
            temperature=0.0
        )
        
        result = response.choices[0].message.content if response.choices else "No choices returned"
        
        return jsonify({
            "status": "ok",
            "model_used": MAIN_MODEL,
            "models_configured": {
                "main": MAIN_MODEL,
                "self_reviewer": SELF_REVIEWER_MODEL,
                "fast": FAST_MODEL
            },
            "base_url": BASE_URL,
            "api_key_configured": bool(API_KEY),
            "model_response": result,
            "raw_response_type": str(type(response)),
            "choices_count": len(response.choices) if response.choices else 0
        })
    except Exception as e:
        import traceback
        return jsonify({
            "status": "error",
            "model_used": MAIN_MODEL,
            "models_configured": {
                "main": MAIN_MODEL,
                "self_reviewer": SELF_REVIEWER_MODEL,
                "fast": FAST_MODEL
            },
            "base_url": BASE_URL,
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": traceback.format_exc()
        }), 500


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





