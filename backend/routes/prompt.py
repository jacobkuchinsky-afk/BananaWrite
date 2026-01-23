"""
Prompt Routes - Handles essay prompt generation endpoints
"""

import json
from flask import Blueprint, request, Response, stream_with_context, jsonify
from services.ai_service import (
    generate_essay_prompt_stream, 
    get_writing_technique, 
    get_total_lessons, 
    WRITING_TECHNIQUES, 
    check_essay,
    review_essay,
    review_essay_with_context,
    get_quiz_requirements,
    create_quiz,
    grade_quiz,
    get_teacher_feedback,
    set_dynamic_thresholds,
    self_review,
    validate_topic,
    teacher_chat
)

prompt_bp = Blueprint('prompt', __name__)


@prompt_bp.route('/api/generate-prompt', methods=['POST'])
def generate_prompt():
    """
    Generate an essay prompt based on the current writing technique.
    
    Request body:
        {
            "userId": "firebase-user-id",
            "lessonIndex": 0,  # or "writingTechnique": "Commas"
            "craziness": "Wild",  # optional - user's craziness setting
            "focus": "Technology"  # optional - user's focus setting
        }
    
    Response: Server-Sent Events stream
        data: {"type": "chunk", "content": "Write"}
        data: {"type": "chunk", "content": " a"}
        ...
        data: {"type": "done", "content": "Full prompt text..."}
    """
    data = request.get_json()
    
    if not data:
        return {"error": "No data provided"}, 400
    
    # Get the writing technique - either from direct string or lesson index
    writing_technique = data.get('writingTechnique')
    
    if not writing_technique:
        lesson_index = data.get('lessonIndex', 0)
        writing_technique = get_writing_technique(lesson_index)
    
    # Get user's craziness, focus, and essay type settings (optional)
    craziness = data.get('craziness')
    focus = data.get('focus')
    essay_type = data.get('essayType')
    
    print(f"[GENERATE_PROMPT] Writing technique: {writing_technique}, Craziness: {craziness}, Focus: {focus}, Essay Type: {essay_type}")
    
    def generate():
        """Generator function for SSE streaming"""
        for chunk_data in generate_essay_prompt_stream(writing_technique, craziness, focus, essay_type):
            # Format as Server-Sent Event
            json_data = json.dumps(chunk_data)
            yield f"data: {json_data}\n\n"
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'  # Disable buffering for nginx
        }
    )


@prompt_bp.route('/api/writing-techniques', methods=['GET'])
def get_techniques():
    """
    Get the list of all writing techniques and total count.
    
    Response:
        {
            "techniques": ["None", "Commas", ...],
            "total": 54
        }
    """
    return {
        "techniques": WRITING_TECHNIQUES,
        "total": get_total_lessons()
    }


@prompt_bp.route('/api/technique/<int:index>', methods=['GET'])
def get_technique_by_index(index: int):
    """
    Get a specific writing technique by its index.
    
    Response:
        {
            "index": 0,
            "technique": "None"
        }
    """
    technique = get_writing_technique(index)
    return {
        "index": index,
        "technique": technique
    }


@prompt_bp.route('/api/check-essay', methods=['POST'])
def check_essay_endpoint():
    """
    Check if the user's essay correctly follows the prompt requirements.
    
    Request body:
        {
            "essay": "The user's essay text...",
            "prompt": "The original prompt...",
            "correction_feedback": "Optional feedback from self-reviewer..."  // optional
        }
    
    Response:
        {
            "correct": true/false,
            "feedback": "What needs to be changed..." (only if incorrect)
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    essay = data.get('essay')
    prompt = data.get('prompt')
    correction_feedback = data.get('correction_feedback')  # Optional
    
    if not essay:
        return jsonify({"error": "No essay provided"}), 400
    
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    
    print(f"[CHECK_ESSAY_ENDPOINT] Checking essay (length: {len(essay)}) against prompt (length: {len(prompt)})")
    if correction_feedback:
        print(f"[CHECK_ESSAY_ENDPOINT] Re-evaluating with correction feedback")
    
    result = check_essay(essay, prompt, correction_feedback)
    
    print(f"[CHECK_ESSAY_ENDPOINT] Result: correct={result.get('correct')}, feedback={result.get('feedback')[:100] if result.get('feedback') else None}")
    
    return jsonify(result)


@prompt_bp.route('/api/review-essay', methods=['POST'])
def review_essay_endpoint():
    """
    Review an essay for learning errors (grammar, punctuation, style).
    
    Request body:
        {
            "essay": "The user's essay text...",
            "correction_feedback": "Optional feedback from self-reviewer..."  // optional
        }
    
    Response:
        {
            "has_errors": true/false,
            "errors": ["Error 1~severity", "Error 2~severity", ...],
            "raw_response": "Full AI response..."
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    essay = data.get('essay')
    correction_feedback = data.get('correction_feedback')  # Optional
    
    if not essay:
        return jsonify({"error": "No essay provided"}), 400
    
    if correction_feedback:
        print(f"[REVIEW_ESSAY_ENDPOINT] Re-evaluating with correction feedback")
    
    result = review_essay(essay, correction_feedback)
    return jsonify(result)


@prompt_bp.route('/api/get-quiz-requirements', methods=['POST'])
def get_quiz_requirements_endpoint():
    """
    Get quiz requirements based on essay errors.
    
    Request body:
        {
            "essay_errors": "Error list string with severities...",
            "learned_topics": ["topic1", "topic2"]  // optional
        }
    
    Response:
        {
            "completed": false,  // true if all topics learned
            "topic": "What the quiz will test...",
            "question_type": "A,B,C,D",
            "question_count": 5
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    essay_errors = data.get('essay_errors')
    learned_topics = data.get('learned_topics', [])
    
    if not essay_errors:
        return jsonify({"error": "No essay errors provided"}), 400
    
    result = get_quiz_requirements(essay_errors, learned_topics)
    return jsonify(result)


@prompt_bp.route('/api/create-quiz', methods=['POST'])
def create_quiz_endpoint():
    """
    Create quiz questions based on requirements.
    
    Request body:
        {
            "topic": "What the quiz will test...",
            "question_type": "A,B,C,D",
            "question_count": 5,
            "last_quiz_results": ""  // optional, for tailoring retries
        }
    
    Response:
        {
            "name": "Quiz Name",
            "questions": [
                {"question": "...", "correct_answer": "..."},
                ...
            ]
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    topic = data.get('topic')
    question_type = data.get('question_type', 'A,B,C,D')
    question_count = data.get('question_count', 5)
    last_quiz_results = data.get('last_quiz_results', '')
    
    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    
    result = create_quiz(topic, question_type, question_count, last_quiz_results)
    return jsonify(result)


@prompt_bp.route('/api/grade-quiz', methods=['POST'])
def grade_quiz_endpoint():
    """
    Grade quiz answers.
    
    Request body:
        {
            "answers": [
                {"user_answer": "B", "question": "...", "correct_answer": "A"},
                ...
            ],
            "correction_feedback": "Optional feedback from self-reviewer..."  // optional
        }
    
    Response:
        {
            "score": 80,  // percentage 0-100
            "feedback": "Detailed feedback string...",
            "passed": true  // score >= 75
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    answers = data.get('answers')
    correction_feedback = data.get('correction_feedback')  # Optional
    
    if not answers:
        return jsonify({"error": "No answers provided"}), 400
    
    if not isinstance(answers, list):
        return jsonify({"error": "Answers must be a list"}), 400
    
    if correction_feedback:
        print(f"[GRADE_QUIZ_ENDPOINT] Re-grading with correction feedback")
    
    result = grade_quiz(answers, correction_feedback)
    return jsonify(result)


@prompt_bp.route('/api/get-teacher-feedback', methods=['POST'])
def get_teacher_feedback_endpoint():
    """
    Get detailed teacher feedback for wrong answers.
    
    Request body:
        {
            "grades_feedback": "The grading feedback string...",
            "answers": [{"user_answer": "B", "question": "...", "correct_answer": "A"}, ...]  // optional but recommended
        }
    
    Response:
        {
            "explanations": ["Explanation 1", "Explanation 2", ...],
            "memory_hooks": ["Tip 1", "Tip 2"]
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    grades_feedback = data.get('grades_feedback')
    answers = data.get('answers', [])  # Full question/answer context
    
    if not grades_feedback:
        return jsonify({"error": "No grades feedback provided"}), 400
    
    result = get_teacher_feedback(grades_feedback, answers)
    return jsonify(result)


@prompt_bp.route('/api/review-essay-redo', methods=['POST'])
def review_essay_redo_endpoint():
    """
    Re-review an essay with memory of original errors.
    Used when user is given a chance to fix their errors (< 5 problems).
    
    Request body:
        {
            "essay": "The user's re-submitted essay text...",
            "original_errors": ["Error 1~severity", "Error 2~severity", ...]
        }
    
    Response:
        {
            "has_errors": true/false,
            "errors": ["Error 1~severity", "Error 2~severity", ...],
            "marked_essay": "Essay with ¦error markers¦",
            "problem_count": 3,
            "raw_response": "Full AI response..."
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    essay = data.get('essay')
    original_errors = data.get('original_errors', [])
    
    if not essay:
        return jsonify({"error": "No essay provided"}), 400
    
    if not original_errors:
        return jsonify({"error": "No original errors provided"}), 400
    
    print(f"[REVIEW_ESSAY_REDO] Re-reviewing essay with {len(original_errors)} original errors")
    
    result = review_essay_with_context(essay, original_errors)
    return jsonify(result)


@prompt_bp.route('/api/app-settings', methods=['POST'])
def update_app_settings_endpoint():
    """
    Update dynamic app settings for AI prompts.
    Called by admin panel to sync settings to the backend.
    
    Request body:
        {
            "sameErrorQuizThreshold": 3,
            "totalErrorQuizThreshold": 5,
            "quizPassingScore": 75
        }
    
    Response:
        {
            "success": true,
            "settings": { ... }
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    same_error_threshold = data.get('sameErrorQuizThreshold', 3)
    total_error_threshold = data.get('totalErrorQuizThreshold', 5)
    passing_score = data.get('quizPassingScore', 75)
    
    # Update the dynamic thresholds in AI service
    set_dynamic_thresholds(
        same_error_threshold=same_error_threshold,
        total_error_threshold=total_error_threshold,
        passing_score=passing_score
    )
    
    print(f"[APP_SETTINGS] Updated thresholds: same_error={same_error_threshold}, total={total_error_threshold}, passing={passing_score}")
    
    return jsonify({
        "success": True,
        "settings": {
            "sameErrorQuizThreshold": same_error_threshold,
            "totalErrorQuizThreshold": total_error_threshold,
            "quizPassingScore": passing_score
        }
    })


@prompt_bp.route('/api/self-review', methods=['POST'])
def self_review_endpoint():
    """
    Review an AI response to check if it was correct.
    Called when user clicks "I think this is wrong" button.
    
    Request body:
        {
            "context_type": "essay_check" | "essay_review" | "quiz_grade",
            "original_response": "The AI response being contested",
            "user_content": "Essay text or formatted quiz answers",
            "original_prompt": "The essay prompt (required for essay_check)"  // optional
        }
    
    Response:
        {
            "is_correct": true/false,  // true if AI was right, false if AI made mistake
            "correction_feedback": "What to fix..." (only if is_correct is false)
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    context_type = data.get('context_type')
    original_response = data.get('original_response')
    user_content = data.get('user_content')
    original_prompt = data.get('original_prompt')  # Optional, needed for essay_check
    
    if not context_type:
        return jsonify({"error": "No context_type provided"}), 400
    
    if context_type not in ['essay_check', 'essay_review', 'quiz_grade']:
        return jsonify({"error": "Invalid context_type. Must be 'essay_check', 'essay_review', or 'quiz_grade'"}), 400
    
    if not original_response:
        return jsonify({"error": "No original_response provided"}), 400
    
    if not user_content:
        return jsonify({"error": "No user_content provided"}), 400
    
    # For essay_check, original_prompt is required
    if context_type == 'essay_check' and not original_prompt:
        return jsonify({"error": "original_prompt is required for essay_check context"}), 400
    
    print(f"[SELF_REVIEW_ENDPOINT] Reviewing AI response for context: {context_type}")
    
    try:
        result = self_review(context_type, original_response, user_content, original_prompt)
        
        print(f"[SELF_REVIEW_ENDPOINT] Result: is_correct={result.get('is_correct')}")
        
        return jsonify(result)
    except Exception as e:
        print(f"[SELF_REVIEW_ENDPOINT] Error: {str(e)}")
        return jsonify({
            "error": f"Self-review failed: {str(e)}",
            "is_correct": True,  # Default to AI being correct on error
            "correction_feedback": None
        }), 500


@prompt_bp.route('/api/validate-topic', methods=['POST'])
def validate_topic_endpoint():
    """
    Validate a custom topic entered by the user.
    
    Request body:
        {
            "topic": "User's custom topic"
        }
    
    Response:
        {
            "valid": true/false,
            "feedback": "Why the topic is invalid..." (only if invalid)
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    topic = data.get('topic')
    
    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    
    if not isinstance(topic, str):
        return jsonify({"error": "Topic must be a string"}), 400
    
    # Trim whitespace
    topic = topic.strip()
    
    if len(topic) == 0:
        return jsonify({"error": "Topic cannot be empty"}), 400
    
    print(f"[VALIDATE_TOPIC_ENDPOINT] Validating topic: '{topic}'")
    
    result = validate_topic(topic)
    
    print(f"[VALIDATE_TOPIC_ENDPOINT] Result: valid={result.get('valid')}")
    
    return jsonify(result)


@prompt_bp.route('/api/teacher-chat', methods=['POST'])
def teacher_chat_endpoint():
    """
    Chat with the AI teacher for help understanding grammar concepts.
    
    Request body:
        {
            "messages": [
                {"role": "user", "content": "..."},
                {"role": "assistant", "content": "..."},
                ...
            ],
            "context": {
                "topic": "Grammar topic",
                "wrongAnswers": [
                    {"question": "...", "userAnswer": "...", "correctAnswer": "..."}
                ],
                "feedbackExplanations": ["..."],
                "memoryHooks": ["..."]
            }
        }
    
    Response:
        {
            "response": "AI response with markdown",
            "raw_response": "Full response"
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    messages = data.get('messages', [])
    context = data.get('context', {})
    
    if not messages or len(messages) == 0:
        return jsonify({"error": "No messages provided"}), 400
    
    # Validate messages format
    for msg in messages:
        if not isinstance(msg, dict):
            return jsonify({"error": "Invalid message format"}), 400
        if 'role' not in msg or 'content' not in msg:
            return jsonify({"error": "Messages must have 'role' and 'content' fields"}), 400
        if msg['role'] not in ['user', 'assistant']:
            return jsonify({"error": "Message role must be 'user' or 'assistant'"}), 400
    
    print(f"[TEACHER_CHAT_ENDPOINT] Processing {len(messages)} messages, topic: {context.get('topic', 'N/A')}")
    
    result = teacher_chat(messages, context)
    
    return jsonify(result)
