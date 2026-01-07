import essay
main_model = "moonshotai/Kimi-K2-Instruct-0905"
quiz_creator_prompt = """"Task: Create a quiz of the amount of questions specified on writing to the requirments specified.
                            
                        Guidlines:
                        - Follow the quiz guidlines exactly
                        - This quiz if for learning and you are teaching
                        - Seperate each section with ~
                        - The name of the quiz should be short and memorable only being a couple or words
                        - The correct answers should be varied for example never put B as the correct answer every time
                        - ALWAYS ADD ~ WHERE THEY ARE ADDED IN THE OUTPUT FORMAT
                        - NEVER PUT THE CORRECT ANSWER IN THE QUIZ QUESTION OONLY EVER PUT IT IN THE GENERAL RIGHT ANSWER SECTION
                        - Do not add extra undeed words like "orignal"
                        - For fill in the black questions it should go like 'type in the punctution the word right before it'. For example: Fill in the right punctuation "John, a skilled craftsmen worked at the junkyard." Correct answer: craftsmen, ONLY DO THIS FOR FILL IN THE BLANK QUESTIONS
                        - You will also be given the results from the last quiz if this is empty ignore it.
                        - Tailor the quiz to the incorrect answers from the last quiz.

                        Output Format:
                        Name (Put the name of the quiz this should give an overall idea of what the quiz is testing)
                        ~
                        Quiz question (This should include the question being asked, any information like a sentence, and how to answer the question)
                        ~ 
                        General right answer (Here put the general right answer such as an example sentence or the right answer on a multiple choice)
                        ~
                        Repeat the quiz questions and General right answer for how ever many questions are asked for. Put ` in between each full question
                        """
grader_prompt = """Job: Grade the current answers on the quiz.
                    - You have been given the users answer, the question, and the correct answer
                    Guidlines:
                    - The output should be very easy to read
                    - Put the percentage correct at the bottom
                    - Seperate the answers and questions and the percentage correct with a ~
                    - Do not worry if the formatting is wrong in the users answers as long as they got it correct
                    
                    Output structure:
                    Give the users answer (Put it in context. For example in fill in the blank put the users answer in the sentence.) Then give the correct answer plus an X or a Check if the user got it right or not. Please also give a formatted with % percentage correct at the bottom of every fully graded quiz.
                    Go in a list for each question
                    ~
                    Percentage correct (Seperated by ~ please give just the number percentage correct with ABSOLUTELY NOTHING ELSE For example: 59) Notice the lack of '%' or '\n'
                    """
teacher_prompt = """Task: Help the student learn from their mistakes to do better next time

                    - You are a freindly teacher and you job is to help the student
                    - The user will give the students grades on a test and you must give them feedback on how to do better
                    - Add a ~ between each section for seperation
                    
                    Feedback strucutre:
                    What you got wrong and why: (Here go question by question explaining in a freindly way what exactly they got wrong and why it is wrong). The formatting for this should have the question is users answer and then the explination.
                    ~   
                    Memory hooks to help (Give 2 memory hooks or tips that can help the user in the future)
                    """

essay_prompt_ceator = f"""Task: Make a fun and engaging prompt for a student to write and essay
                            - This prompt should be 1-2 sentences long
                            - Be creative with the topic and make it truly interesting but not completly crazy. 
                            - The essay should be 300 words long
                            - Essay types: Expository, Argumentative, Narrative, Fictional
                            Output strucutre:
                            Prompt
                            Important information (If the prompt relies on the user knowing items like data give it in a list here as examples. This should not be creative details just details for ideas like expository essays)"""
def newlines(amount):
    print("\n"*amount)

def testing(type):
    essay.ai("Create the prompt making sure the essay tests the users skill of: " + str(type), essay_prompt_ceator, False, main_model)
    user_essay = "The American Revolution: A Fight for Independence The American Revolution was one of the most important events in world history. It began in 1775 and lasted until 1783 when the thirteen American colonies broke away from British rule to form a new independent nation. This conflict changed the course of history and established principles that would influence democracies around the world. The causes of the Revolution were numerous and complex. The British government imposed various taxes on the colonists including the Stamp Act and the Townshend Acts, without giving them representation in Parliament. The colonists believed this was unfair and they began to protest using the slogan No taxation without representation. Tensions continued to rise and eventually led to violent confrontations. One of the first major conflicts was the Boston Massacre in 1770 where British soldiers fired into a crowd of colonists killing five people. This event was widely publicized and turned many colonists against British rule. Then in 1773 the Boston Tea Party occurred when colonists dumped tea into the harbor to protest the Tea Act, this act of defiance showed that the colonists were willing to take bold action. The fighting officially began in April 1775 with the Battles of Lexington and Concord. The Continental Congress appointed George Washington as commander of the Continental Army and the colonies began organizing their military efforts. On July 4 1776 the Continental Congress adopted the Declaration of Independence written primarily by Thomas Jefferson, which formally announced the colonies intention to separate from Britain. The war was long and difficult with many challenges. The Continental Army was poorly equipped and trained compared to the professional British forces. However the Americans had several advantages including fighting on their own soil strong leadership from Washington and help from foreign allies particularly France. The French provided crucial military and financial support that helped turn the tide of the war. Several key battles shaped the outcome of the Revolution. The Battle of Saratoga in 1777 was a turning point that convinced France to enter the war on the American side. The winter at Valley Forge in 1777-1778 was a time of great hardship but the army emerged stronger and more disciplined. Finally the Battle of Yorktown in 1781 resulted in the surrender of British General Cornwallis effectively ending the major fighting. The Treaty of Paris was signed in 1783 officially recognizing American independence. The new nation then faced the challenge of creating a government, which led to the drafting of the Constitution in 1787. The Revolution had succeeded in creating a new country based on democratic principles and individual rights that would serve as a model for other nations seeking freedom. In conclusion the American Revolution was a transformative event that established the United States as an independent nation. It demonstrated that people could overthrow an oppressive government and create a new system based on liberty and self-governance, the legacy of the Revolution continues to influence American society and democratic movements worldwide today."


    quiz_rec = essay.get_quiz(user_essay)
    if quiz_rec == "No Errors":
        return True
    newlines(5)
    print("Quiz topic (Follow this):" + str(quiz_rec[0])+"Question type" + str(quiz_rec[1])+ "Amount of questions:" + str(quiz_rec[2]))
    newlines(5)
    answers = []
    running = True
    quizing = True
    quiz_results = ""
    while running:
        answers = []
        quiz = essay.ai("Quiz topic (Follow this):" + str(quiz_rec[0]) + "Question type" + str(quiz_rec[1]) + "Amount of questions:" + str(quiz_rec[2])+ "The results from the last quiz: "+ str(quiz_results), quiz_creator_prompt, False, main_model)
        quizing = True
        while quizing:
            quiz_list = quiz.split("`")
            for i in range(len(quiz_list)):  
                
                question = quiz_list[i].split("~")
                
                # Check if question has at least 3 elements (indices 0, 1, 2)
                if len(question) < 3:
                    continue  # Skip empty or malformed entries
                
                print(question[1])
                answers.append("User answer: " + input("Enter the answer: ") + " | Question: " + str(question[1]) + " | Correct Answer: " + str(question[2]))
                print(answers)
            
            grades = essay.ai(str(answers), grader_prompt, False, main_model)
            grades = grades.split("~")
            print(grades[0])
            grade = int(grades[1])
            if grade < 80:
                essay.ai(grades[0], teacher_prompt, False, main_model)
                quizing = False
            else:
                quizing = False
                print("You Passed! XP has been rewarded")
                quiz_rec = essay.get_new_quiz_req(quiz_rec)
                if "<completed>" in str(quiz_rec).lower():
                    running = False
                
    print("Module is fully completed final test incoming")
    return False