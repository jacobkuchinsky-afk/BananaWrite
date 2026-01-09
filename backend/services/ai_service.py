"""
AI Service - Handles all AI interactions for BananaWrite
Refactored from essay.py for use with Flask backend
"""

import logging
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Chutes API configuration from environment variables
API_KEY = os.getenv('CHUTES_API_KEY', '')
BASE_URL = os.getenv('CHUTES_BASE_URL', 'https://llm.chutes.ai/v1')
MAIN_MODEL = "moonshotai/Kimi-K2-Instruct-0905"

# Log warning if API key is missing (but don't fail during import/build)
if not API_KEY:
    logger.warning("CHUTES_API_KEY environment variable not set! API calls will fail.")

# Writing techniques list - progression of skills to learn
WRITING_TECHNIQUES = [
    "None",
    "Commas",
    "Periods",
    "Semicolons",
    "Colons",
    "Apostrophes",
    "Quotation marks",
    "Question marks",
    "Hyphens",
    "Dashes (em dash, en dash)",
    "Parentheses",
    "Brackets",
    "Ellipses",
    "Subject-verb agreement",
    "Verb conjugation",
    "Pronoun-antecedent agreement",
    "Active vs. passive voice",
    "Parallel structure",
    "Modifiers",
    "Compound sentences",
    "Complex sentences",
    "Compound-complex sentences",
    "Subordinating conjunctions",
    "Coordinating conjunctions",
    "Transitional phrases",
    "Point of view",
    "Paragraph structure",
    "Topic sentences",
    "Thesis statements",
    "Metaphors and similes",
    "Capitalization",
    "Dialogue formatting",
    "Direct and indirect quotations",
    "Citation styles",
    "Homophones",
]

# Default craziness and focus (used if not provided)
DEFAULT_CRAZINESS = "Engaging"
DEFAULT_FOCUS = "Technology"

def get_essay_prompt_creator(craziness: str = None, focus: str = None) -> str:
    """
    Generate the essay prompt creator system instruction with dynamic craziness and focus.
    
    Args:
        craziness: The craziness level (e.g., "Wild", "Absurd", "Mundane")
        focus: The topic focus (e.g., "Technology", "Sports", "History")
    
    Returns:
        The system prompt for essay prompt generation
    """
    craziness_level = craziness or DEFAULT_CRAZINESS
    focus_topic = focus or DEFAULT_FOCUS
    
    return f"""Task: Generate a 1-2 sentence essay prompt for a student.

Requirements:
- Topic: {focus_topic} (focus on one specific detail within this topic)
- Tone/Creativity Level: {craziness_level} (applies to humor, uniqueness, and engagement)
- Target Audience: Ages 14-18 (match maturity and comedy level accordingly)
- Target Essay Length: 225 words
- Essay Types: Expository, Argumentative, Narrative, or Fictional

Writing Technique Rules:
- ONLY include a writing technique requirement if one is explicitly provided
- When a technique IS provided, specify the exact quantity needed (e.g., "Include exactly 4 compound sentences")
- Writing techniques are requirements FOR the essay, not topics ABOUT the technique
- Never require additional techniques beyond what is specified

Restrictions:
- Never request intentionally incorrect grammar or punctuation
- Never add requirements that were not explicitly requested

Context Information:
- If the prompt requires specific knowledge (facts, data, historical context), provide that information on the second line

Output Format:
Line 1: The essay prompt (1-2 sentences)
Line 2: Supporting information for the writer, OR "None" if not needed

Example Output:
"Write an expository essay explaining the lore of your favorite video game. Include exactly 4 compound sentences."
None

Example Output (with context):
"Write an argumentative essay defending why the 1969 Moon landing was humanity's greatest achievement."
Key facts: Apollo 11 mission, Neil Armstrong and Buzz Aldrin, July 20, 1969, 400,000+ NASA employees involved"""

ESSAY_CHECKER_PROMPT = """Task: Verify whether the essay meets the prompt's specific requirements.

Evaluation Criteria:
- Check ONLY for explicit requirements stated in the prompt (e.g., "use 5 commas", "include 2 semicolons")
- Count specified elements carefully; allow a margin of ±1 for close attempts
- Ignore grammar quality—evaluate only requirement compliance
- Ignore word count—exceeding the minimum is always acceptable
- If no countable requirements exist, verify the essay addresses the topic

Output Rules:
- CORRECT ESSAY: Output exactly "<Correct>" with no additional text
- INCORRECT ESSAY: Provide one brief, specific instruction on what to fix

Example - Correct:
<Correct>

Example - Incorrect:
Add 2 more commas to reach the required 5 commas.

Example - Incorrect:
Include at least one semicolon as specified in the prompt."""

# Essay reviewer prompt - checks for learning errors in the essay
REVIEWER_PROMPT = """Task: Identify grammar and writing errors in the essay.

Scope:
- Report ONLY objective grammar/punctuation/syntax errors
- Ignore: spelling, style preferences, creativity, flow, word choice suggestions
- Group repeated error types under one category (e.g., multiple comma errors = one "Commas" entry)
- Report only significant errors; ignore minor issues
- Count individual error instances within each category

Severity Scale: 1 (minor) to 10 (severe)

No Errors Found:
- If no significant errors exist, output exactly: <No Errors>

Quiz Tag Rule:
- If any single error category has 3 or more individual instances, add <quiz> as the FIRST line of output
- Example: 3 comma errors in the essay = add <quiz> tag

Output Format:
<quiz> (ONLY if 3+ instances of the same error type exist)
§[count of distinct error categories]§
- [Error category and description] (X instances)~[severity 1-10]
- [Error category and description] (X instances)~[severity 1-10]
µ
[Full essay with each error wrapped in ¦ markers]

Example WITHOUT quiz tag (fewer than 3 of any single type):
§2§
- Comma splices creating run-on sentences (2 instances)~7
- Colons used incorrectly as periods (1 instance)~5
µ
The dog ran fast¦,¦ it was excited. The weather was nice¦:¦ We went outside.

Example WITH quiz tag (3+ of same type):
<quiz>
§2§
- Comma splices creating run-on sentences (4 instances)~7
- Colons used incorrectly as periods (1 instance)~5
µ
The dog ran fast¦,¦ it was excited¦,¦ the cat jumped¦,¦ they played¦,¦ it was fun. The weather was nice¦:¦ We went outside."""

# Essay reviewer prompt for re-evaluation (with memory of original errors)
REVIEWER_REDO_PROMPT = """Task: Re-evaluate the essay after the user attempted to fix the original errors.

Original Errors to Check:
{original_errors}

Evaluation Steps:
1. Verify whether each original error has been corrected
2. Identify any new errors introduced during revision
3. Report only significant grammar/punctuation/syntax errors
4. Ignore: spelling, style preferences, creativity, flow
5. Count individual error instances within each category

Severity Scale: 1 (minor) to 10 (severe)

All Fixed:
- If all original errors are fixed AND no new significant errors exist, output exactly: <No Errors>

Quiz Tag Rule:
- If any single error category has 3 or more individual instances, add <quiz> as the FIRST line of output

Output Format:
<quiz> (ONLY if 3+ instances of the same error type exist)
§[count of distinct error categories]§
- [Error description] (X instances)~[severity] [UNFIXED or NEW]
- [Error description] (X instances)~[severity] [UNFIXED or NEW]
µ
[Full essay with each error wrapped in ¦ markers]"""


# Quiz decider prompt - determines what quiz to create based on errors
QUIZ_DECIDER_PROMPT = """Task: Design a quiz specification targeting the user's most critical unlearned error.

Input: Error list with severity ratings (1=minor, 10=severe) and list of already-learned topics.

Selection Logic:
1. Skip any error topic already marked as learned
2. Select the highest-severity unlearned error as the quiz focus
3. If all error topics are learned, output exactly: <Completed>

Quiz Sizing: 3-10 questions based on severity (higher severity = more questions)

Output Format (sections separated by ~):
[Detailed quiz focus description with specific examples from the errors]
~
[Question format: "Multiple Choice (A,B,C,D)" OR "Fill in the Blank" OR "Written Response"]
~
[Number of questions as a single integer]

Example:
Quiz targeting comma splices: The user incorrectly joins independent clauses with commas instead of semicolons or periods. Questions will present sentences and ask the user to identify or correct comma splice errors.
~
Multiple Choice (A,B,C,D)
~
6"""

# Quiz creator prompt - generates the actual quiz questions
QUIZ_CREATOR_PROMPT = """Task: Generate quiz questions based on the provided specifications.

Requirements:
- Create exactly the specified number of questions on the given topic
- Vary correct answer positions (don't make all answers "B")
- Ensure exactly ONE grammatically correct answer per question
- Never reveal the answer within the question text itself
- If previous quiz results are provided, focus on areas the user got wrong

Question Type Tags (REQUIRED):
- Multiple Choice: Wrap each option with <MULTI> tags
- Fill in Blank: Wrap entire question with <FILL> tags  
- Written Response: Wrap entire question with <TYPE> tags

Output Format:
[Quiz Name (2-4 words)]
~
[Question with appropriate tags]
~
[Correct answer: letter for multiple choice, or exact text for fill/type]
`
[Next question...]
~
[Answer...]
`
[Continue pattern for all questions]

Example - Multiple Choice:
Comma Quiz
~
Which sentence uses commas correctly?
<MULTI>A. The dog, ran quickly.</MULTI>
<MULTI>B. I bought apples, oranges, and bananas.</MULTI>
<MULTI>C. She said, that she would come.</MULTI>
<MULTI>D. The tall, man walked by.</MULTI>
~
B
`

Example - Fill in Blank:
~
<FILL>What punctuation belongs after "craftsman" in: "John, a skilled craftsman worked daily."</FILL>
~
,
`

Example - Written Response:
~
<TYPE>Rewrite with correct punctuation: "The dog ran fast the cat jumped high"</TYPE>
~
The dog ran fast. The cat jumped high."""

# Grader prompt - grades quiz answers
GRADER_PROMPT = """Task: Grade each quiz answer for grammatical correctness.

Grading Rules:
- Accept ANY grammatically valid answer, even if it differs from the expected answer
- For punctuation: semicolons, periods, and "comma + conjunction" are often interchangeable between independent clauses
- Multiple choice: Letter must match exactly
- Fill-in/Written: Accept equivalent correct forms

Acceptable Equivalents (all correct for joining independent clauses):
- "The dog ran; the cat jumped."
- "The dog ran. The cat jumped."  
- "The dog ran, and the cat jumped."

Output Format:
[Question 1]: User answered "[answer]" — Expected "[correct]" — ✓ or ✗
[Question 2]: User answered "[answer]" — Expected "[correct]" — ✓ or ✗
[Continue for all questions]
~
[Percentage as integer only, no % symbol]

Example:
Q1: User answered "B" — Expected "B" — ✓
Q2: User answered "semicolon" — Expected "period" — ✓ (grammatically valid alternative)
Q3: User answered "A" — Expected "C" — ✗
~
67"""

# Teacher prompt - provides feedback for wrong answers
TEACHER_PROMPT = """Task: Provide friendly, educational feedback for incorrect quiz answers.

Tone: Encouraging and supportive—help the student understand, not feel bad.

For Each Wrong Answer, Explain:
1. The question asked
2. What the student answered
3. The correct answer
4. WHY the correct answer is right (clear explanation)

Output Format:
[Explanation for wrong answer 1]
|||
[Explanation for wrong answer 2]
|||
[Continue for each wrong answer]
~
[Memory tip 1]
|||
[Memory tip 2]

Provide exactly 2 memory hooks/tips after the ~ separator.

Example:
Question: "Which punctuation joins two related sentences?" You answered: comma. Correct answer: semicolon. A comma alone creates a comma splice—semicolons can join two complete, related thoughts without a conjunction.
|||
Question: "Add punctuation after 'however'." You answered: period. Correct answer: comma. When "however" interrupts a sentence, it needs commas around it, not a period.
~
Semicolons are "soft periods"—they connect complete sentences that are closely related in meaning.
|||
Conjunctive adverbs (however, therefore, moreover) need commas after them when they start a clause."""


def create_client():
    """Create and return an OpenAI client configured for Chutes API"""
    return OpenAI(
        base_url=BASE_URL,
        api_key=API_KEY
    )


def generate_essay_prompt_stream(writing_technique: str, craziness: str = None, focus: str = None):
    """
    Generator function that yields chunks of the essay prompt as they stream in.
    
    Args:
        writing_technique: The current writing skill to focus on (e.g., "Commas")
        craziness: The craziness level for the prompt (e.g., "Wild", "Absurd")
        focus: The topic focus for the prompt (e.g., "Technology", "Sports")
    
    Yields:
        dict: Contains 'type' ('chunk' or 'done') and 'content' (the text chunk or full prompt)
    """
    client = create_client()
    
    # Get the system prompt with dynamic craziness and focus
    system_prompt = get_essay_prompt_creator(craziness, focus)
    
    # Build the user message based on whether there's a specific technique
    if writing_technique and writing_technique.lower() != "none":
        user_message = f"Create an essay prompt. The student is currently learning about: {writing_technique}. Subtly incorporate opportunities to practice this skill."
    else:
        user_message = "Create an essay prompt with no specific writing techinque needed."
    
    try:
        stream = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            stream=True
        )
        
        full_response = ""
        
        for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta_content = chunk.choices[0].delta.content
                if delta_content:
                    full_response += delta_content
                    yield {
                        "type": "chunk",
                        "content": delta_content
                    }
        
        # Send the complete response at the end
        yield {
            "type": "done",
            "content": full_response
        }
        
    except Exception as e:
        yield {
            "type": "error",
            "content": str(e)
        }


def get_writing_technique(lesson_index: int) -> str:
    """
    Get the writing technique for a given lesson index.
    
    Args:
        lesson_index: The current lesson number (0-indexed)
    
    Returns:
        The writing technique string, or "None" if index is out of bounds
    """
    if 0 <= lesson_index < len(WRITING_TECHNIQUES):
        return WRITING_TECHNIQUES[lesson_index]
    return "None"


def get_total_lessons() -> int:
    """Return the total number of writing techniques/lessons"""
    return len(WRITING_TECHNIQUES)


def check_essay(essay: str, prompt: str) -> dict:
    """
    Check if the user's essay correctly follows the prompt requirements.
    
    Args:
        essay: The user's submitted essay text
        prompt: The original essay prompt
    
    Returns:
        dict: Contains 'correct' (bool) and 'feedback' (str if incorrect)
    """
    client = create_client()
    
    user_message = f"""Original Prompt:
{prompt}

User's Essay:
{essay}

Check if this essay follows the prompt requirements. Remember: If correct, respond with ONLY <Correct> and nothing else."""
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": ESSAY_CHECKER_PROMPT},
                {"role": "user", "content": user_message}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        result_lower = result.lower()
        
        # Log the AI response for debugging
        logger.info(f"[CHECK_ESSAY] AI Response: '{result}'")
        logger.info(f"[CHECK_ESSAY] Response length: {len(result)}")
        
        # Check if the essay is correct using multiple detection patterns
        # Primary check: exact tag format
        is_correct = False
        detection_reason = ""
        
        # Check for <Correct> tag (case insensitive)
        if "<correct>" in result_lower:
            is_correct = True
            detection_reason = "Found <Correct> tag"
        # Check if the entire response is just "correct" (no angle brackets)
        elif result_lower == "correct" or result_lower == "correct.":
            is_correct = True
            detection_reason = "Response is exactly 'correct'"
        # Check for common positive-only responses (very short affirmations)
        elif len(result) < 50 and any(phrase in result_lower for phrase in [
            "essay is correct",
            "essay follows the prompt",
            "follows the requirements",
            "meets the requirements",
            "correctly follows",
            "requirements are met",
            "well done",
            "great job"
        ]) and not any(phrase in result_lower for phrase in [
            "does not", "doesn't", "need to", "needs to", "add more", 
            "missing", "should include", "must include", "require"
        ]):
            is_correct = True
            detection_reason = "Short positive response detected"
        
        logger.info(f"[CHECK_ESSAY] Is correct: {is_correct}, Reason: {detection_reason or 'No match found - treating as incorrect'}")
        
        if is_correct:
            return {
                "correct": True,
                "feedback": None
            }
        else:
            return {
                "correct": False,
                "feedback": result
            }
            
    except Exception as e:
        return {
            "correct": False,
            "feedback": f"Error checking essay: {str(e)}"
        }


def _parse_review_response(result: str, essay: str) -> dict:
    """
    Helper function to parse the review response from the AI.
    
    Args:
        result: The raw AI response
        essay: The original essay text (used as fallback for marked_essay)
    
    Returns:
        dict: Parsed review data including 'force_quiz' flag
    """
    # Check if no errors found
    if "<No Errors>" in result or "<no errors>" in result.lower():
        return {
            "has_errors": False,
            "errors": [],
            "marked_essay": essay,
            "problem_count": 0,
            "force_quiz": False,
            "raw_response": result
        }
    
    # Check for <quiz> tag - indicates 3+ errors of same type
    force_quiz = "<quiz>" in result.lower()
    
    # Remove the quiz tag for further parsing
    result_cleaned = result
    if force_quiz:
        import re
        result_cleaned = re.sub(r'<quiz>\s*', '', result_cleaned, flags=re.IGNORECASE)
    
    # Parse problem count from §[count]§
    problem_count = 0
    import re
    count_match = re.search(r'§(\d+)§', result_cleaned)
    if count_match:
        problem_count = int(count_match.group(1))
        # Remove the count marker from the result for further parsing
        result_without_count = re.sub(r'§\d+§\s*', '', result_cleaned, count=1)
    else:
        result_without_count = result_cleaned
    
    # Split by µ to separate error list from marked essay
    marked_essay = ""
    errors_section = result_without_count
    
    if "µ" in result_without_count:
        parts = result_without_count.split("µ", 1)
        errors_section = parts[0].strip()
        marked_essay = parts[1].strip() if len(parts) > 1 else ""
    
    # Parse errors - they are separated by newlines or dashes
    errors = []
    lines = errors_section.split('\n')
    for line in lines:
        line = line.strip()
        if line and line.startswith('-'):
            errors.append(line[1:].strip())
        elif line and '~' in line:
            errors.append(line)
    
    # If no parsed errors but we have content, treat the whole thing as errors
    if not errors and errors_section:
        errors = [errors_section]
    
    # If problem_count wasn't parsed, use the number of errors as fallback
    if problem_count == 0 and errors:
        problem_count = len(errors)
    
    # If no marked essay was extracted, use original essay
    if not marked_essay:
        marked_essay = essay
    
    # IMPORTANT: Check if there are actually any highlighted errors in the marked essay
    # If the marked_essay contains no ¦ characters, the AI didn't highlight anything
    # This means there are no errors, even if the AI didn't explicitly say <No Errors>
    if '¦' not in marked_essay:
        return {
            "has_errors": False,
            "errors": [],
            "marked_essay": essay,
            "problem_count": 0,
            "force_quiz": False,
            "raw_response": result
        }
    
    return {
        "has_errors": True,
        "errors": errors,
        "marked_essay": marked_essay,
        "problem_count": problem_count,
        "force_quiz": force_quiz,
        "raw_response": result
    }


def review_essay(essay: str) -> dict:
    """
    Review an essay for learning errors (grammar, punctuation, style issues).
    
    Args:
        essay: The user's submitted essay text
    
    Returns:
        dict: Contains 'has_errors' (bool), 'errors' (list of error strings with severity),
              'marked_essay' (str with errors surrounded by ¦), 'problem_count' (int),
              and 'raw_response' (str)
    """
    client = create_client()
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": REVIEWER_PROMPT},
                {"role": "user", "content": essay}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        return _parse_review_response(result, essay)
        
    except Exception as e:
        return {
            "has_errors": False,
            "errors": [],
            "marked_essay": essay,
            "problem_count": 0,
            "raw_response": f"Error reviewing essay: {str(e)}"
        }


def review_essay_with_context(essay: str, original_errors: list) -> dict:
    """
    Re-review an essay with memory of the original errors found.
    Used when user is given a chance to fix their errors.
    
    Args:
        essay: The user's re-submitted essay text
        original_errors: List of original error strings that were found
    
    Returns:
        dict: Contains 'has_errors' (bool), 'errors' (list of error strings with severity),
              'marked_essay' (str with errors surrounded by ¦), 'problem_count' (int),
              and 'raw_response' (str)
    """
    client = create_client()
    
    # Format original errors for the prompt
    original_errors_str = "\n".join(f"- {error}" for error in original_errors)
    
    # Create the redo prompt with original errors context
    redo_prompt = REVIEWER_REDO_PROMPT.format(original_errors=original_errors_str)
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": redo_prompt},
                {"role": "user", "content": essay}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        return _parse_review_response(result, essay)
        
    except Exception as e:
        return {
            "has_errors": False,
            "errors": [],
            "marked_essay": essay,
            "problem_count": 0,
            "raw_response": f"Error reviewing essay: {str(e)}"
        }


def _is_topic_already_learned(topic: str, learned_topics: list) -> bool:
    """
    Check if a topic is already in the learned topics list.
    Uses fuzzy matching to catch similar topics.
    """
    if not topic or not learned_topics:
        return False
    
    topic_lower = topic.lower()
    
    for learned in learned_topics:
        learned_lower = learned.lower()
        
        # Exact match
        if topic_lower == learned_lower:
            return True
        
        # Check if one contains the other (for partial matches)
        if topic_lower in learned_lower or learned_lower in topic_lower:
            return True
        
        # Extract key terms and check for significant overlap
        # Remove common words and check core topic
        common_words = {'quiz', 'targeting', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'to'}
        topic_words = set(topic_lower.split()) - common_words
        learned_words = set(learned_lower.split()) - common_words
        
        if topic_words and learned_words:
            # Check for significant word overlap (more than 50% of smaller set)
            overlap = topic_words & learned_words
            min_words = min(len(topic_words), len(learned_words))
            if min_words > 0 and len(overlap) / min_words > 0.5:
                return True
    
    return False


def get_quiz_requirements(essay_errors: str, learned_topics: list = None) -> dict:
    """
    Get quiz requirements based on essay errors.
    
    Args:
        essay_errors: String of essay errors with severity ratings
        learned_topics: List of topics already learned/passed
    
    Returns:
        dict: Contains 'completed' (bool if all topics learned),
              'topic' (str), 'question_type' (str), 'question_count' (int)
    """
    client = create_client()
    
    # Ensure learned_topics is a list
    learned_topics = learned_topics or []
    
    # Build the prompt with learned topics if any
    prompt = essay_errors
    if learned_topics:
        prompt += "\n\nAlready learned: " + ", ".join(learned_topics)
    
    logger.debug(f"[GET_QUIZ_REQUIREMENTS] Learned topics: {learned_topics}")
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": QUIZ_DECIDER_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        
        logger.debug(f"[GET_QUIZ_REQUIREMENTS] AI response: {result[:200]}...")
        
        # Check if all topics completed
        if "<Completed>" in result or "<completed>" in result.lower():
            logger.info("[GET_QUIZ_REQUIREMENTS] AI returned <Completed>")
            return {
                "completed": True,
                "topic": None,
                "question_type": None,
                "question_count": 0,
                "raw_response": result
            }
        
        # Parse the response - split by ~
        parts = result.split("~")
        
        topic = parts[0].strip() if len(parts) > 0 else ""
        question_type = parts[1].strip() if len(parts) > 1 else "A,B,C,D"
        
        # Try to extract question count as a number
        question_count = 5  # default
        if len(parts) > 2:
            count_str = parts[2].strip()
            # Extract just the number
            import re
            numbers = re.findall(r'\d+', count_str)
            if numbers:
                question_count = min(int(numbers[0]), 10)  # Cap at 10
        
        # SAFETY CHECK: If the AI returns a topic that's already learned, force completion
        # This prevents infinite loops when the AI doesn't return <Completed>
        if _is_topic_already_learned(topic, learned_topics):
            logger.warning(f"[GET_QUIZ_REQUIREMENTS] Topic '{topic}' appears to be already learned. Forcing completion.")
            return {
                "completed": True,
                "topic": None,
                "question_type": None,
                "question_count": 0,
                "raw_response": result + "\n[FORCED COMPLETION: Topic already learned]"
            }
        
        logger.info(f"[GET_QUIZ_REQUIREMENTS] New topic to learn: '{topic}'")
        
        return {
            "completed": False,
            "topic": topic,
            "question_type": question_type,
            "question_count": question_count,
            "raw_response": result
        }
        
    except Exception as e:
        logger.error(f"[GET_QUIZ_REQUIREMENTS] Error: {str(e)}")
        return {
            "completed": False,
            "topic": f"Error: {str(e)}",
            "question_type": "A,B,C,D",
            "question_count": 5,
            "raw_response": str(e)
        }


def _parse_quiz_with_backticks(result: str) -> tuple:
    """
    Parse quiz using backtick delimiters (original format).
    Returns (quiz_name, questions_list).
    """
    question_blocks = result.split("`")
    questions = []
    quiz_name = ""
    
    for i, block in enumerate(question_blocks):
        parts = block.split("~")
        
        if i == 0:
            # First block contains the quiz name
            quiz_name = parts[0].strip() if len(parts) > 0 else "Quiz"
            # First block might also have the first question
            if len(parts) >= 3:
                questions.append({
                    "question": parts[1].strip() if len(parts) > 1 else "",
                    "correct_answer": parts[2].strip() if len(parts) > 2 else ""
                })
        else:
            # Skip empty or malformed blocks
            if len(parts) < 2:
                continue
                
            # Handle blocks that might start with ~ or have different structures
            question_text = ""
            answer_text = ""
            
            for j, part in enumerate(parts):
                part = part.strip()
                if not part:
                    continue
                if not question_text:
                    question_text = part
                elif not answer_text:
                    answer_text = part
                    break
            
            if question_text:
                questions.append({
                    "question": question_text,
                    "correct_answer": answer_text
                })
    
    return quiz_name, questions


def _parse_quiz_with_tilde_patterns(result: str) -> tuple:
    """
    Fallback parser that looks for ~question~answer patterns throughout the text.
    Used when backtick parsing yields insufficient questions.
    """
    import re
    
    # Extract quiz name from the first line
    lines = result.split('\n')
    quiz_name = lines[0].strip().replace('~', '').strip() if lines else "Quiz"
    
    # Find all ~content~ patterns - questions and answers alternate
    # Pattern: find content between ~ delimiters
    parts = result.split('~')
    
    questions = []
    # Skip the first part (quiz name), then process pairs
    # parts[0] = quiz name, parts[1] = question1, parts[2] = answer1, parts[3] = question2, etc.
    i = 1
    while i < len(parts) - 1:
        question_text = parts[i].strip()
        answer_text = parts[i + 1].strip() if i + 1 < len(parts) else ""
        
        # Clean up answer - might have trailing content from next question
        # Look for where the next question might start (after a backtick or double newline)
        if '`' in answer_text:
            answer_text = answer_text.split('`')[0].strip()
        
        # Skip empty questions
        if question_text and len(question_text) > 5:  # Minimum question length
            questions.append({
                "question": question_text,
                "correct_answer": answer_text
            })
        
        i += 2
    
    return quiz_name, questions


def _parse_quiz_numbered_format(result: str) -> tuple:
    """
    Parse quiz in numbered format (e.g., "1. Question\nAnswer: A\n2. Question...")
    """
    import re
    
    # Extract quiz name from the first line
    lines = result.split('\n')
    quiz_name = lines[0].strip() if lines else "Quiz"
    # Remove any delimiters from quiz name
    quiz_name = quiz_name.replace('~', '').replace('`', '').strip()
    
    questions = []
    
    # Pattern to match numbered questions
    # Match: number followed by period/parenthesis, then question text
    question_pattern = re.compile(r'(?:^|\n)\s*(\d+)[.)]\s*(.+?)(?=\n\s*(?:\d+[.)]|Answer|Correct|$))', re.DOTALL | re.IGNORECASE)
    answer_pattern = re.compile(r'(?:Answer|Correct(?:\s+Answer)?)\s*[:\s]*([A-D]|.+?)(?=\n|$)', re.IGNORECASE)
    
    # Try to find question-answer pairs
    matches = question_pattern.findall(result)
    
    for num, q_text in matches:
        q_text = q_text.strip()
        if not q_text:
            continue
            
        # Look for answer after this question
        # Find where this question ends in the original text
        q_pos = result.find(q_text)
        if q_pos != -1:
            remaining = result[q_pos + len(q_text):]
            answer_match = answer_pattern.search(remaining[:500])  # Look in next 500 chars
            answer = answer_match.group(1).strip() if answer_match else ""
        else:
            answer = ""
        
        if len(q_text) > 5:  # Minimum question length
            questions.append({
                "question": q_text,
                "correct_answer": answer
            })
    
    return quiz_name, questions


def create_quiz(topic: str, question_type: str, question_count: int, last_quiz_results: str = "") -> dict:
    """
    Create quiz questions based on requirements.
    
    Args:
        topic: What the quiz will test
        question_type: Type of questions (A,B,C,D, fill in blank, etc.)
        question_count: Number of questions
        last_quiz_results: Results from previous quiz attempt (for tailoring)
    
    Returns:
        dict: Contains 'name' (str), 'questions' (list of question dicts)
    """
    client = create_client()
    
    prompt = f"Quiz topic (Follow this): {topic}\nQuestion type: {question_type}\nAmount of questions: {question_count}"
    if last_quiz_results:
        prompt += f"\nThe results from the last quiz: {last_quiz_results}"
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": QUIZ_CREATOR_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        
        logger.debug(f"[CREATE_QUIZ] Raw AI response:\n{result[:500]}...")
        
        # Try parsing with backticks first (expected format)
        quiz_name, questions = _parse_quiz_with_backticks(result)
        
        logger.debug(f"[CREATE_QUIZ] Backtick parsing found {len(questions)} questions")
        
        # If we got fewer questions than expected, try fallback parsers
        if len(questions) < question_count:
            logger.debug(f"[CREATE_QUIZ] Trying tilde pattern parsing...")
            alt_name, alt_questions = _parse_quiz_with_tilde_patterns(result)
            if len(alt_questions) > len(questions):
                quiz_name = alt_name if alt_name and alt_name != "Quiz" else quiz_name
                questions = alt_questions
                logger.debug(f"[CREATE_QUIZ] Tilde parsing found {len(questions)} questions")
        
        # If still not enough, try numbered format
        if len(questions) < question_count:
            logger.debug(f"[CREATE_QUIZ] Trying numbered format parsing...")
            alt_name, alt_questions = _parse_quiz_numbered_format(result)
            if len(alt_questions) > len(questions):
                quiz_name = alt_name if alt_name and alt_name != "Quiz" else quiz_name
                questions = alt_questions
                logger.debug(f"[CREATE_QUIZ] Numbered parsing found {len(questions)} questions")
        
        logger.info(f"[CREATE_QUIZ] Final result: {len(questions)} questions parsed for '{quiz_name}'")
        
        return {
            "name": quiz_name,
            "questions": questions,
            "raw_response": result
        }
        
    except Exception as e:
        logger.error(f"[CREATE_QUIZ] Error: {str(e)}")
        return {
            "name": "Error Quiz",
            "questions": [],
            "raw_response": f"Error creating quiz: {str(e)}"
        }


def grade_quiz(answers: list) -> dict:
    """
    Grade quiz answers.
    
    Args:
        answers: List of dicts with 'user_answer', 'question', 'correct_answer'
    
    Returns:
        dict: Contains 'score' (int 0-100), 'feedback' (str), 'passed' (bool)
    """
    client = create_client()
    
    # Format answers for the grader
    formatted_answers = []
    for a in answers:
        formatted_answers.append(
            f"User answer: {a.get('user_answer', '')} | Question: {a.get('question', '')} | Correct Answer: {a.get('correct_answer', '')}"
        )
    
    prompt = "\n".join(formatted_answers)
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": GRADER_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse the response - split by ~
        parts = result.split("~")
        
        feedback = parts[0].strip() if len(parts) > 0 else result
        
        # Try to extract the score
        score = 0
        if len(parts) > 1:
            score_str = parts[1].strip()
            import re
            numbers = re.findall(r'\d+', score_str)
            if numbers:
                score = int(numbers[0])
        
        return {
            "score": score,
            "feedback": feedback,
            "passed": score >= 75,
            "raw_response": result
        }
        
    except Exception as e:
        return {
            "score": 0,
            "feedback": f"Error grading quiz: {str(e)}",
            "passed": False,
            "raw_response": str(e)
        }


def get_teacher_feedback(grades_feedback: str) -> dict:
    """
    Get detailed teacher feedback for wrong answers.
    
    Args:
        grades_feedback: The grading feedback from grade_quiz
    
    Returns:
        dict: Contains 'explanations' (list of str), 'memory_hooks' (list of str)
    """
    client = create_client()
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": TEACHER_PROMPT},
                {"role": "user", "content": grades_feedback}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse the response - split by ~ to separate explanations from memory hooks
        parts = result.split("~")
        
        explanations_raw = parts[0].strip() if len(parts) > 0 else result
        memory_hooks_raw = parts[1].strip() if len(parts) > 1 else ""
        
        # Split explanations by ||| delimiter (one per question)
        explanation_list = [e.strip() for e in explanations_raw.split("|||") if e.strip()]
        
        # If no ||| delimiters found, treat the whole thing as one explanation
        if len(explanation_list) == 0:
            explanation_list = [explanations_raw] if explanations_raw else ["No feedback available."]
        
        # Parse memory hooks by ||| delimiter
        hook_list = [h.strip() for h in memory_hooks_raw.split("|||") if h.strip()]
        
        # If no ||| delimiters found in hooks, try newlines as fallback
        if len(hook_list) == 0 and memory_hooks_raw:
            hook_list = [h.strip() for h in memory_hooks_raw.split('\n') if h.strip() and len(h.strip()) > 10]
        
        # Ensure we have at least one hook
        if len(hook_list) == 0:
            hook_list = ["Practice makes perfect! Keep working on these concepts."]
        
        return {
            "explanations": explanation_list,
            "memory_hooks": hook_list,
            "raw_response": result
        }
        
    except Exception as e:
        return {
            "explanations": [f"Error getting feedback: {str(e)}"],
            "memory_hooks": ["Keep practicing and you'll improve!"],
            "raw_response": str(e)
        }
