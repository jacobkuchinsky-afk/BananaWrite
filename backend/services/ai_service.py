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
    
    return f"""Task: Make a fun and engaging prompt for a student to write an essay

Guidelines:
- This prompt should be 1-2 sentences long
- The topic should craziness level, unqiueness level, humor, and interestingness level should be{craziness_level}
- The prompt should be focused on {focus_topic} make it focusesd on a very specific detail of this topic.
- Never ask the user to write with purposefully incorrect grammar or punctuation.
- Never ask the user to include something if you are not told to include it
- The prompt should make sense
- The essay should be 225 words long
- Essay types: Expository, Argumentative, Narrative, Fictional
- IF AND ONLY IF a specific writing technique is provided, subtly encourage its use in the prompt
- IF A WRITING TECHNIQUE IS NOT PROVIDED DO NOT MAKE IT REQUIRED IN YOUR PROMPT.
- Be specific for example if you need to make a prompt focusing on commas tell the user how many commas they need ect.
- If you are not asked to make the prompt anything specific ignore focusing the prompt on anything
- The prompt should make sense examples: "Write an an essay about your favorite food and why its better than any other food" "Write a narrtive about a boy who explores a world where currency is made of your reputation"
- The prompts focus like for example 'compound sentences' should not actually be about compound sentences but rather require them. For example: 'Write an expository on the lore of your favorite video game, it should have 4 compound sentences' 
- The prompt does not need to be super postive it should be suited for the comedy and maturness of a 14-18 year old.
- Never ask for more than than the writing technique requires. For example if the writing tehcinue is topic sentences, do not also ask for conjuntions.
- Give extra information if the prompt requires the user to know something like a specific topic.
Output structure:
First line: The main prompt (1-2 sentences)
Second line: Important information (If the prompt relies on the user knowing items like data, give it in a list here as examples. This should not be creative details, just details for ideas like expository essays. If none needed, write "None")"""

ESSAY_CHECKER_PROMPT = """Check if the user's essay correctly follows the prompt requirements.

CRITICAL INSTRUCTION - YOU MUST FOLLOW THIS EXACTLY:
- If the essay CORRECTLY follows the prompt requirements, respond with ONLY these 9 characters: <Correct>
- Do NOT add ANY other text, explanation, or praise when correct - ONLY output: <Correct>
- The ONLY acceptable response for a correct essay is: <Correct>
- The user can ALWAYS go over the minimum word count.
- The prompt word count does not need to be followed.
- Read the essay very carefuly.
- Do not make mistakes.
- You can make mistakes when counting if the prompt asks for a specific number of something and the essay is close allow the user to pass.
- Try to count accurately.
Guidelines:
- Check if the prompt asks for something specific (like "use 3 commas", "include 2 semicolons")
- Count carefully - if it asks for 3 commas, count the commas in the essay
- Grammar mistakes do NOT matter - only check if specific prompt requirements are met
- Be LENIENT - if the essay reasonably follows the prompt, mark it as correct
- If there are no specific countable requirements, and the essay addresses the topic, it is correct

IF CORRECT:
Output EXACTLY: <Correct>
(Nothing else - no "Great job!", no explanations, just the tag)

IF NOT CORRECT:
Return a brief, helpful, encouraging message about what specifically needs to be changed.

Example outputs for CORRECT essays:
<Correct>

Example outputs for INCORRECT essays:
Add 2 more commas to meet the requirement of 5 commas in your essay.
Your essay needs to include at least one semicolon as specified in the prompt.

REMEMBER: When correct, output ONLY: <Correct>"""

# Essay reviewer prompt - checks for learning errors in the essay
REVIEWER_PROMPT = """Task: Review the following essay and output a list of mistakes made in it

Guidelines:
- Give a list of all problems in the essay generalized so if a comma problem comes up multiple times generalize under 'commas'.
- Do not follow the comma example exactly please tailor it to the essay.
- The output should be given in a list
- Separated by ~ add the severity of the issue (1-10)
- If there are no major errors (very small errors are ok) respond with only <No Errors>
- NEVER mark small errors.
- Only mark large errors.
- Put the µ between the errors and the essay marked
- You only care about grammar mistakes/writing mistakes you do not care about spelling, flow, or make sentences more "Unique","Creative","Complex" or anything else that is not completly factual and objective.
- IMPORTANT: Count the number of DISTINCT problem categories and output it at the very start using § delimiters.

DO NOT DO:
- Never mark someone wrong for something not empirical, for example do not mark the essay wrong for as an example "lack of adjectives"

Output structure:
§[number of distinct problems]§
List of problems (Example: - Commas are misused and often end up with run on sentences~7 - Colons are used like periods~5 - Oxford comma is not used in lists~3)
µ 
Essay marked(Here put the full essay but with the character ¦ sorounding each error Example: Sentence ¦ error ¦ Sentence ¦ error ¦ Sentence)

Example output:
§3§
- Commas are misused and often end up with run on sentences~7
- Colons are used like periods~5
- Oxford comma is not used in lists~3
µ
The essay text ¦with errors¦ marked like this."""

# Essay reviewer prompt for re-evaluation (with memory of original errors)
REVIEWER_REDO_PROMPT = """Task: Re-review the following essay. The user was given one chance to fix their errors.

ORIGINAL ERRORS FOUND:
{original_errors}

Guidelines:
- The user is re-submitting their essay after being shown the above errors.
- Check if the ORIGINAL errors have been fixed.
- Also check for any NEW errors that may have been introduced.
- Give a list of all remaining/new problems generalized.
- Separated by ~ add the severity of the issue (1-10)
- If all original errors are fixed AND no new major errors exist, respond with only <No Errors>
- NEVER mark small errors.
- Only mark large errors.
- Put the µ between the errors and the essay marked
- You only care about grammar mistakes/writing mistakes you do not care about spelling, flow, or make sentences more "Unique","Creative","Complex" or anything else that is not completely factual and objective.
- IMPORTANT: Count the number of DISTINCT problem categories and output it at the very start using § delimiters.

DO NOT DO:
- Never mark someone wrong for something not empirical

Output structure:
§[number of distinct problems]§
List of problems (with note if it was an original unfixed error or a new error)
µ 
Essay marked(Here put the full essay but with the character ¦ surrounding each error)"""


# Quiz decider prompt - determines what quiz to create based on errors
QUIZ_DECIDER_PROMPT = """Task: Read the following essay problems and make a quiz prompt that will help teach exactly what needs to be taught

Guidelines: 
- Output one target quiz prompt
- Never make a quiz on something that has already been learned.
- The numbers given beside the problems are how serious and prevalent the problems are use them to decide what problems to target in the quiz (1 is minimal and 10 is very bad)
- Separate each section of your output with a ~
- The amount of questions should be under 10 and depend on the severity of the problem
- There may also be some skills that have been learned if the skill that is denoted as a problem is already learned move on to the next biggest problem to make quiz requirements.
- If the user has learned every problem return with <Completed>
- Add specific examples from the problems to include in the quiz.

Output Structure:
- First add what the quiz will test (Example: The user needs a quiz targeted on when to capitalize letters when a sentence starts and when the letter 'i' is present. Go on to give more details on how exactly the questions will be posed)
~
- Second add what type of questions the quiz will use (A,B,C,D or Fill in the blank, or type out an answer)
~
- Last add the amount of questions in the quiz (just the number)"""

# Quiz creator prompt - generates the actual quiz questions
QUIZ_CREATOR_PROMPT = """Task: Create a quiz of the amount of questions specified on writing to the requirements specified.

Guidelines:
- Follow the quiz guidelines exactly
- This quiz is for learning and you are teaching
- Separate each section with ~
- The name of the quiz should be short and memorable only being a couple of words
- The correct answers should be varied for example never put B as the correct answer every time
- ALWAYS ADD ~ WHERE THEY ARE ADDED IN THE OUTPUT FORMAT
- NEVER PUT THE CORRECT ANSWER IN THE QUIZ QUESTION ONLY EVER PUT IT IN THE GENERAL RIGHT ANSWER SECTION
- Do not add extra unneeded words like "original"
- You will also be given the results from the last quiz if this is empty ignore it.
- Tailor the quiz to the incorrect answers from the last quiz.
- Never put the correct answer in the question so if you are asking what punctuation to use never put the punctuation already in the example sentence.
- Only one answer should ever be grammtically correct there should never be more than more than one answer that is correct.
- You can make nuanced questions to try to trick the user BUT THERE SHOULD ALWAYS BE A VERIFIABLE CORRECT ANSWER.
- The questions should always be varied and have different answer from one another.

IMPORTANT - Question Type Formatting:
You MUST use these exact tags based on question type:

FOR MULTIPLE CHOICE QUESTIONS - Wrap each option with <MULTI> tags:
Example: Which punctuation separates items in a list?
<MULTI>A. Period</MULTI>
<MULTI>B. Comma</MULTI>
<MULTI>C. Semicolon</MULTI>
<MULTI>D. Colon</MULTI>

FOR FILL IN THE BLANK QUESTIONS - Wrap the question with <FILL> tags:
<FILL>Type the punctuation that should go after "craftsmen" in this sentence: "John, a skilled craftsmen worked at the junkyard."</FILL>

FOR TYPE OUT ANSWER QUESTIONS - Wrap the question with <TYPE> tags:
<TYPE>Rewrite this sentence with correct comma placement: "The dog ran fast and the cat jumped high."</TYPE>

Output Format:
Name (Put the name of the quiz - short and memorable)
~
Quiz question (Use the appropriate tags as shown above - <MULTI>, <FILL>, or <TYPE>)
~ 
Correct answer (The letter for multiple choice like "B", or the actual answer for fill/type)
~
Repeat for each question. Put ` between each full question."""

# Grader prompt - grades quiz answers
GRADER_PROMPT = """Job: Grade the current answers on the quiz.
- You have been given the users answer, the question, and the correct answer

CRITICAL GRADING RULES:
- Mark the answer CORRECT (✓) if it is GRAMMATICALLY VALID, even if different from the provided "correct answer"
- For punctuation questions, multiple answers are often correct:
  * Semicolons (;) CAN join two related independent clauses - this is ALWAYS correct
  * Periods (.) between independent clauses are correct
  * Comma + coordinating conjunction (and, but, so, or, yet, for, nor) is correct
  * These are often interchangeable: "The dog ran; the cat jumped" = "The dog ran. The cat jumped" = "The dog ran, and the cat jumped"
- DO NOT mark wrong just because the answer differs from the expected answer
- The user's answer is correct if it creates a grammatically valid sentence
- For multiple choice, the letter must match exactly

Guidelines:
- The output should be very easy to read
- Put the percentage correct at the bottom
- Separate the answers and questions and the percentage correct with a ~
- Be LENIENT - if the grammar works, it's correct

Output structure:
Give the users answer (Put it in context). Then give the correct answer plus an X or a Check (✓) if the user got it right or not.
Go in a list for each question
~
Percentage correct (Separated by ~ please give just the number percentage correct with ABSOLUTELY NOTHING ELSE For example: 59) Notice the lack of '%' or '\\n'"""

# Teacher prompt - provides feedback for wrong answers
TEACHER_PROMPT = """Task: Help the student learn from their mistakes to do better next time

- You are a friendly teacher and your job is to help the student
- The user will give the students grades on a test and you must give them feedback on how to do better
- IMPORTANT: Use ||| to separate EACH question's feedback (one ||| between each question explanation)
- Use ~ to separate the explanations section from the memory hooks section

Feedback structure:
Question 1 feedback: State the question, what the user answered, the correct answer, and explain WHY it's wrong in a friendly way.
|||
Question 2 feedback: Same format - question, user's answer, correct answer, and friendly explanation.
|||
(Continue for each wrong answer, separated by |||)
~
Memory hooks: Give exactly 2 memory hooks or tips that can help the user remember these concepts in the future. Separate each tip with |||

Example output:
Question: "Which is correct?" Your answer: B. Correct answer: A. The reason A is correct is because...
|||
Question: "Fill in the blank..." Your answer: comma. Correct answer: semicolon. A semicolon is needed here because...
~
Tip 1: Remember that semicolons connect two complete sentences that are related.
|||
Tip 2: Think of a semicolon as a "soft period" - it's stronger than a comma but gentler than a period."""


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
        dict: Parsed review data
    """
    # Check if no errors found
    if "<No Errors>" in result or "<no errors>" in result.lower():
        return {
            "has_errors": False,
            "errors": [],
            "marked_essay": essay,
            "problem_count": 0,
            "raw_response": result
        }
    
    # Parse problem count from §[count]§
    problem_count = 0
    import re
    count_match = re.search(r'§(\d+)§', result)
    if count_match:
        problem_count = int(count_match.group(1))
        # Remove the count marker from the result for further parsing
        result_without_count = re.sub(r'§\d+§\s*', '', result, count=1)
    else:
        result_without_count = result
    
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
            "raw_response": result
        }
    
    return {
        "has_errors": True,
        "errors": errors,
        "marked_essay": marked_essay,
        "problem_count": problem_count,
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
    
    # Build the prompt with learned topics if any
    prompt = essay_errors
    if learned_topics:
        prompt += "\n\nAlready learned: " + ", ".join(learned_topics)
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=[
                {"role": "system", "content": QUIZ_DECIDER_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content.strip()
        
        # Check if all topics completed
        if "<Completed>" in result or "<completed>" in result.lower():
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
        
        return {
            "completed": False,
            "topic": topic,
            "question_type": question_type,
            "question_count": question_count,
            "raw_response": result
        }
        
    except Exception as e:
        return {
            "completed": False,
            "topic": f"Error: {str(e)}",
            "question_type": "A,B,C,D",
            "question_count": 5,
            "raw_response": str(e)
        }


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
        
        # Parse the quiz - questions are separated by `
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
        
        return {
            "name": quiz_name,
            "questions": questions,
            "raw_response": result
        }
        
    except Exception as e:
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
