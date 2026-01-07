import os
import pathlib
from dotenv import load_dotenv
from openai import OpenAI


reviewer_prompt = """Task: Review the follow essay and output a list of mistakes made in it
                    Guidlines:
                    - Give a list of all problems in the essay generilized so if a comma problem comes up multiple times generlize under 'commas'.
                    - The output should be given in a list
                    - Seperated by ~ add the secerity of the issue (1-10)
                    - If there are no major errors (very small errors are ok) respond with only <No Errors>
                    DO NOT DO:
                    - Never mark someone wrong for something not emprical, for example do not mark the essay wrong for as an example "lack of adjetives"
                    Output structure:
                    List of probems (Example: - Commas are misused and often end up with run on sentences - Colons are used like peroids, - Oxford comma is not used in lists. )"""

quiz_decider = """Task: Read the following essay problems and make a quiz prompt that will help teach exactly what needs to be tuaght

                    Guidlines: 
                    - Output one target quiz prompt
                    - The numbers given beside the problems are how seroius and prevlelant the problems are use them to decide what problems to target in the quiz (1 is minimal and 10 is very bad)
                    - Seperate each section of your output with a ~
                    - The amount of questiosn should be under 10 and depend on the severity of the problem
                    - There may also be some skills that have been learned if the skill that is denoted as a problem is already learned move on to the next biggest problem to make quiz requirments.
                    - If the user has learned every problem return with <Completed>
                    - Add specific examples from the problems to include in the quiz.
                    

                    Output Structure:
                    - First add what the quiz will test(Example: The user needs a quiz targeted on when to capitlize letters when a sentence starts and when the letter 'i' is present. (Go on to give more details on how exactly the questions will be posed ))
                    ~
                    - Second add what type of questions the quiz will use (A,B,C,D or Fill in the blank, or type out an answer)
                    ~
                    - Last add the amount of questions in the quiz
                    """

main_model = "moonshotai/Kimi-K2-Instruct-0905"

def ai(prompt, instructions, think, model):
    # Chutes API key (hardcoded for development)
    api_key = os.environ.get("CHUTES_API_KEY", "")

    # Create a client for Chutes with the correct base URL
    client = OpenAI(
        base_url="https://llm.chutes.ai/v1",
        api_key=api_key
    )

    # Send a message to the model
    call_args = {
        "model": model,
        "messages": [
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ],
        "stream": True  # Enable streaming
    }

    if think:
        call_args["max_tokens"] = 3000

    stream = client.chat.completions.create(**call_args)
    answer = ""
    
    try:
        for chunk in stream:
            # Check if choices exist and have content
            if chunk.choices and len(chunk.choices) > 0:
                delta_content = chunk.choices[0].delta.content
                if delta_content:
                    print(delta_content, end="", flush=True)
                    answer += delta_content
    except (IndexError, AttributeError) as e:
        # Gracefully handle any streaming errors
        print(f"\nStream ended or encountered an error: {e}")
    
    print()  # New line after streaming
    return answer

essay_errors = ""
api = os.environ.get("CHUTES_API_KEY", "")
def get_quiz(essay):
    essay_errors = ai(essay, reviewer_prompt, False, main_model)
    print(essay_errors)
    if "<No Errors>" in str(essay_errors):
        return "No Errors"
    quiz_req = ai(essay_errors, quiz_decider, False, main_model)
    return quiz_req.split("~")
def get_new_quiz_req(done):
    quiz_req = ai(essay_errors + "Already learned: "+ str(done), quiz_decider, False, main_model)
    return quiz_req.split("~")