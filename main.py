import quiz_creator

writing_techniques = [
    "None",
    "Commas",
    "Periods",
    "Semicolons",
    "Colons",
    "Apostrophes",
    "Quotation marks",
    "Question marks",
    "Exclamation points",
    "Hyphens",
    "Dashes (em dash, en dash)",
    "Parentheses",
    "Brackets",
    "Ellipses",
    "Subject-verb agreement",
    "Verb conjugation",
    "Pronoun-antecedent agreement",
    "Verb tenses",
    "Active vs. passive voice",
    "Parallel structure",
    "Modifiers",
    "Dangling modifiers",
    "Run-on sentences",
    "Sentence fragments",
    "Simple sentences",
    "Compound sentences",
    "Complex sentences",
    "Compound-complex sentences",
    "Subordinating conjunctions",
    "Coordinating conjunctions",
    "Transitional phrases",
    "Point of view",
    "Tone",
    "Diction",
    "Syntax",
    "Paragraph structure",
    "Topic sentences",
    "Thesis statements",
    "Showing vs. telling",
    "Imagery",
    "Metaphors and similes",
    "Capitalization",
    "Italics",
    "Dialogue formatting",
    "Direct and indirect quotations",
    "Citation styles",
    "Homophones",
    "Sentence variety",
    "Conciseness",
    "Clarity",
    "Proofreading"
]

current_lesson = 0 #Would be stored as a firebase variable obv
running = True
while running:
    if quiz_creator.test(writing_techniques[current_lesson]):
        print("Module Completed")
        current_lesson += 1

