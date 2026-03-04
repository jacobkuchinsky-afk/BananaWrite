import { DifficultyLevel } from '@/types'

export interface GradeWritingTips {
  overview: string
  essayFormat: string
  tips: string[]
  teksStandards: string
}

export interface TechniqueGuide {
  what: string
  why: string
  howToUse: string
  exampleSnippet: string
}

export const GRADE_WRITING_TIPS: Record<DifficultyLevel, GradeWritingTips> = {
  basic: {
    overview:
      'At the 4th-grade level you are building the foundation of good writing. Your essays should use complete sentences, correct punctuation, and clear ideas. Focus on telling the reader exactly what you mean using simple, well-organized sentences.',
    essayFormat:
      'Your essay should be about 150 words and follow this structure:\n\n' +
      '1. Introduction (2–3 sentences) — Tell the reader what your essay is about. Start with something interesting to grab attention.\n\n' +
      '2. Body (3–5 sentences) — Give details, reasons, or examples that support your main idea. Each sentence should connect to the one before it.\n\n' +
      '3. Conclusion (1–2 sentences) — Wrap up your essay by restating your main idea or sharing a final thought.',
    tips: [
      'Read the prompt carefully and make sure every sentence connects to the topic.',
      'Use capital letters at the start of every sentence and for names of people, places, and things.',
      'End every sentence with the right punctuation — a period, question mark, or exclamation point.',
      'Check that your verbs match your subjects: "The dog runs" not "The dog run."',
      'Use words like "and," "but," and "so" to connect ideas smoothly.',
      'Read your essay out loud — if something sounds wrong, fix it!',
      'Make sure every sentence is complete with a subject and a verb.',
    ],
    teksStandards:
      'TEKS 4th Grade ELA: Students compose literary and informational texts using correct conventions of punctuation (periods, question marks, commas in series, apostrophes, quotation marks), capitalization (proper nouns, titles, sentence beginnings), subject-verb agreement, correct verb tense, pronoun usage, and complete simple and compound sentences.',
  },
  learning: {
    overview:
      'At the 6th-grade level you are expected to write with more variety and control. Your essays should demonstrate command of basic conventions while introducing more advanced sentence structures, punctuation marks, and organizational strategies. You should be able to explain ideas clearly and connect them logically.',
    essayFormat:
      'Your essay should be about 200 words and follow this structure:\n\n' +
      '1. Introduction (2–3 sentences) — Hook the reader with an interesting opening. Clearly state your main idea or position.\n\n' +
      '2. Body Paragraph 1 (3–4 sentences) — Present your first supporting point with a detail or example.\n\n' +
      '3. Body Paragraph 2 (3–4 sentences) — Present a second supporting point. Use transitional phrases to connect to the previous paragraph.\n\n' +
      '4. Conclusion (2–3 sentences) — Summarize your main points and leave the reader with something to think about.',
    tips: [
      'Vary your sentence length — mix short punchy sentences with longer, more detailed ones.',
      'Use transitional phrases like "however," "in addition," and "for example" to guide the reader.',
      'Try using semicolons to connect two closely related ideas instead of always using periods.',
      'Make sure every pronoun clearly refers back to a specific noun.',
      'Write mostly in active voice ("The team won the game") rather than passive ("The game was won by the team").',
      'Keep your verb tense consistent throughout — don\'t switch between past and present without a reason.',
      'Use colons to introduce lists or explanations.',
      'Proofread for commonly confused words: affect/effect, their/there/they\'re, its/it\'s.',
    ],
    teksStandards:
      'TEKS 6th Grade ELA: Students write with command of conventions including commas (compound sentences, introductory elements, transitions), semicolons between independent clauses, colons after independent clauses, parentheses for supplementary information, complex sentences using subordinating conjunctions, conjunctive adverbs, correlative conjunctions, subject-verb agreement in complex constructions, consistent verb tense, active and passive voice, relative pronouns, pronoun clarity and case, parallel structure, and correct spelling of grade-level vocabulary.',
  },
  proficient: {
    overview:
      'At the 9th-grade level you are expected to demonstrate mastery of all foundational writing conventions and deploy advanced techniques with precision. Your essays should feature varied sentence structures, sophisticated punctuation, well-developed paragraphs, and a clear, sustained argument or narrative. Every element of your writing — from thesis to tone — should be intentional.',
    essayFormat:
      'Your essay should be about 225 words and follow this structure:\n\n' +
      '1. Introduction (3–4 sentences) — Open with an engaging hook (anecdote, question, bold statement). Present a clear thesis statement that previews your argument or purpose.\n\n' +
      '2. Body Paragraph 1 (4–5 sentences) — Begin with a strong topic sentence. Develop the point with evidence, analysis, or examples. End with a sentence that transitions to the next paragraph.\n\n' +
      '3. Body Paragraph 2 (4–5 sentences) — Present a second, distinct supporting point. Use varied sentence structures (compound, complex, compound-complex). Include a transition.\n\n' +
      '4. Conclusion (3–4 sentences) — Synthesize (do not merely repeat) your main points. End with a thought-provoking closing statement that extends the significance of your argument.',
    tips: [
      'Craft a thesis statement that is specific, arguable, and previews your essay\'s structure.',
      'Begin each body paragraph with a topic sentence that directly supports the thesis.',
      'Use em dashes for emphasis and parenthetical asides — they add sophistication to your prose.',
      'Employ parallel structure in lists, comparisons, and correlative conjunctions (not only…but also).',
      'Vary your sentence types: simple, compound, complex, and compound-complex.',
      'Use metaphors and similes to make abstract ideas concrete and memorable.',
      'Maintain a consistent register and tone throughout the essay.',
      'Avoid dangling and misplaced modifiers — place descriptive phrases next to what they describe.',
      'Use who/whom correctly: "who" for subjects, "whom" for objects.',
      'Proofread for advanced confused words: allude/elude, imply/infer, farther/further, lay/lie.',
    ],
    teksStandards:
      'TEKS 9th Grade (English I) ELA — Mastery Standard: Students demonstrate mastery of all prior conventions with zero tolerance for fragments, run-ons, comma splices, and basic agreement errors. Additional skills include restrictive vs. nonrestrictive commas, em dashes for emphasis, hyphens in compound modifiers, ellipses for omission, varied sentence structures, advanced parallel structure, modifier placement, who/whom, subjunctive mood, consistent register and tone, tense consistency across paragraphs, and correct spelling of advanced academic vocabulary.',
  },
}

export const TECHNIQUE_GUIDE: Record<DifficultyLevel, Record<string, TechniqueGuide>> = {
  basic: {
    'Commas': {
      what: 'A comma is a small curved mark ( , ) that tells the reader to take a short pause. Commas help separate items in a list and connect ideas in a sentence.',
      why: 'Commas keep your writing clear so the reader doesn\'t get confused. Without commas, sentences can run together and mean the wrong thing. TEKS 4th Grade requires you to use commas in a series and in compound sentences.',
      howToUse: 'Use commas in three main ways:\n• In a list of three or more items: put a comma after each item except the last.\n• Before connecting words (and, but, so) when joining two complete ideas.\n• After an introductory word or phrase at the start of a sentence.',
      exampleSnippet: 'List: "I packed a sandwich, an apple, and a juice box."\nCompound: "I wanted to play outside, but it was raining."\nIntroductory: "After school, we went to the park."',
    },
    'Periods': {
      what: 'A period is the dot ( . ) at the end of a sentence. It tells the reader that one complete thought is finished.',
      why: 'Periods are the most basic punctuation mark. Every complete sentence needs one. Without periods your writing would be one long run-on. TEKS 4th Grade expects correct end punctuation on every sentence.',
      howToUse: 'Put a period at the end of every sentence that makes a statement or gives information. Make sure each sentence before the period has a subject (who or what) and a verb (what happens).',
      exampleSnippet: 'Correct: "The cat climbed the tree. It looked down at us."\nIncorrect: "The cat climbed the tree it looked down at us"',
    },
    'Question marks': {
      what: 'A question mark ( ? ) goes at the end of a sentence that asks something. It tells the reader that the sentence is a question, not a statement.',
      why: 'Without a question mark, the reader won\'t know you\'re asking something. TEKS 4th Grade requires correct end punctuation including question marks.',
      howToUse: 'Put a question mark at the end of any sentence that asks a question. You can use questions to get the reader thinking (these are called rhetorical questions) or to show a character asking something.',
      exampleSnippet: 'Direct question: "Have you ever seen a shooting star?"\nRhetorical question: "Who doesn\'t love a sunny day?"',
    },
    'Apostrophes': {
      what: 'An apostrophe ( \' ) is a small floating mark used in two ways: to show that something belongs to someone (possession) or to squish two words together (contractions).',
      why: 'Apostrophes prevent confusion. "The dogs bone" looks wrong — "the dog\'s bone" is clear. TEKS 4th Grade expects correct apostrophe use in possessives and contractions.',
      howToUse: 'For possession, add \'s to the owner: "Maria\'s backpack." For contractions, the apostrophe replaces the missing letters: "do not" becomes "don\'t."',
      exampleSnippet: 'Possessive: "The bird\'s nest was high in the tree."\nContraction: "I can\'t wait for summer."',
    },
    'Quotation marks': {
      what: 'Quotation marks ( " " ) go around the exact words someone says out loud. They show the reader that these are spoken words, not the narrator\'s thoughts.',
      why: 'Quotation marks separate dialogue from narration so the reader knows who is talking. TEKS 4th Grade requires correct quotation marks in dialogue with proper punctuation.',
      howToUse: 'Put quotation marks at the beginning and end of what someone says. The punctuation (comma, period, question mark) goes inside the closing quotation mark.',
      exampleSnippet: '"I found a treasure map!" shouted Jake.\nMom asked, "Did you finish your homework?"',
    },
    'Capitalization': {
      what: 'Capitalization means making a letter uppercase (big). You use capital letters in specific places to follow the rules of writing.',
      why: 'Capital letters signal the start of a new sentence and identify proper nouns like names and places. TEKS 4th Grade covers capitalization of sentence beginnings, proper nouns, titles, and historical events.',
      howToUse: 'Always capitalize:\n• The first word of every sentence.\n• Names of people, pets, cities, states, and countries.\n• Titles of books, movies, and holidays.\n• The word "I."',
      exampleSnippet: 'Correct: "Last July, Maria visited New York City."\nIncorrect: "last july, maria visited new york city."',
    },
    'Subject-verb agreement': {
      what: 'Subject-verb agreement means the action word (verb) must match the subject of the sentence. If the subject is one thing, the verb is singular. If the subject is more than one thing, the verb is plural.',
      why: 'When subjects and verbs don\'t agree, sentences sound wrong and confuse the reader. TEKS 4th Grade requires basic singular and plural subject-verb agreement.',
      howToUse: 'Find the subject of your sentence first, then make sure the verb matches.\n• One dog runs. Two dogs run.\n• She walks. They walk.\nWatch out for tricky subjects like "everyone" (singular) and "both" (plural).',
      exampleSnippet: 'Correct: "The flowers bloom in spring." (flowers = plural, bloom = plural)\nIncorrect: "The flowers blooms in spring."',
    },
    'Verb conjugation': {
      what: 'Verb conjugation means changing a verb to show when something happens — in the past, right now, or in the future.',
      why: 'Using the correct verb tense tells the reader when events take place. Mixing tenses without reason is confusing. TEKS 4th Grade covers past, present, and future tense including irregular verbs.',
      howToUse: 'Pick a tense and stay consistent:\n• Past: "I walked to school." (already happened)\n• Present: "I walk to school." (happening now)\n• Future: "I will walk to school." (hasn\'t happened yet)\nWatch out for irregular verbs — they don\'t follow the usual -ed rule.',
      exampleSnippet: 'Regular: walk → walked\nIrregular: run → ran (not "runned"), go → went (not "goed")',
    },
    'Pronoun-antecedent agreement': {
      what: 'A pronoun (he, she, it, they) takes the place of a noun. The noun it replaces is called the antecedent. They need to match in number and type.',
      why: 'If a pronoun doesn\'t clearly match its antecedent, the reader won\'t know who or what you\'re talking about. TEKS 4th Grade requires clear pronoun reference.',
      howToUse: 'Make sure every pronoun points back to one specific noun:\n• If the noun is singular, use a singular pronoun.\n• If the noun is plural, use a plural pronoun.\n• Make it obvious which noun the pronoun refers to.',
      exampleSnippet: 'Correct: "Sam grabbed his backpack." (his → Sam)\nConfusing: "Sam and Jake grabbed his backpack." (whose backpack?)',
    },
    'Coordinating conjunctions': {
      what: 'Coordinating conjunctions are seven small words that connect ideas: For, And, Nor, But, Or, Yet, So (remember FANBOYS).',
      why: 'These words let you join ideas together smoothly instead of writing lots of choppy short sentences. TEKS 4th Grade expects correct use of coordinating conjunctions.',
      howToUse: 'Use a coordinating conjunction to connect:\n• Two words: "cats and dogs"\n• Two phrases: "in the park or at the beach"\n• Two complete sentences: add a comma before the conjunction: "I like pizza, but my sister prefers pasta."',
      exampleSnippet: '"I studied hard, so I did well on the test."\n"We can go swimming or play basketball."',
    },
    'Compound sentences': {
      what: 'A compound sentence joins two complete ideas (independent clauses) together using a comma and a coordinating conjunction (and, but, or, so, etc.).',
      why: 'Compound sentences make your writing flow better and show how ideas relate to each other. TEKS 4th Grade requires writing compound sentences and avoiding run-ons and comma splices.',
      howToUse: 'Take two short sentences that are related, put a comma after the first one, add a FANBOYS conjunction, then write the second sentence.\nFormula: [Complete idea], [conjunction] [complete idea].',
      exampleSnippet: 'Two sentences: "The sun was setting. The sky turned orange."\nCompound: "The sun was setting, and the sky turned orange."',
    },
    'Point of view': {
      what: 'Point of view is who is telling the story. First person uses "I" and "we." Third person uses "he," "she," and "they."',
      why: 'Switching point of view in the middle of an essay confuses the reader. TEKS 4th Grade requires consistent point of view throughout a piece.',
      howToUse: 'Before you start writing, decide on your point of view and stick with it:\n• First person (I/we): You are part of the story.\n• Third person (he/she/they): You are describing someone else\'s experience.\nNever mix them in the same essay.',
      exampleSnippet: 'Consistent (first person): "I walked into the room. I noticed the window was open."\nInconsistent: "I walked into the room. She noticed the window was open." (who is "she"?)',
    },
    'Dialogue formatting': {
      what: 'Dialogue formatting is how you write conversations between characters. Each speaker gets quotation marks around their words and a new paragraph when a different person talks.',
      why: 'Proper formatting makes dialogue easy to follow so the reader always knows who is speaking. TEKS 4th Grade expects correctly punctuated dialogue with quotation marks and paragraph breaks.',
      howToUse: 'Rules for dialogue:\n• Put quotation marks around spoken words.\n• Use a comma to separate the quote from the speaker tag.\n• Start a new paragraph every time a different character speaks.\n• Capitalize the first word inside the quotation marks.',
      exampleSnippet: '"Can we go to the park?" asked Emma.\n"Sure, let me grab my shoes," said Dad.\n"Yay! I\'ll get the soccer ball!" Emma replied.',
    },
  },

  learning: {
    'Commas': {
      what: 'Commas create pauses that organize your writing. Beyond lists and compound sentences, commas follow introductory elements (words, phrases, or dependent clauses) at the start of a sentence.',
      why: 'Correct comma use prevents misreading and shows sentence sophistication. TEKS 6th Grade adds commas after introductory dependent clauses, introductory words, and transitions to the 4th-grade comma skills.',
      howToUse: 'Use commas for:\n• Lists of three or more items.\n• Before a coordinating conjunction joining two independent clauses.\n• After introductory words/phrases: "However, …" "After the game, …"\n• After an introductory dependent clause: "Although it was late, we kept playing."',
      exampleSnippet: 'Introductory phrase: "During the thunderstorm, the power went out."\nIntroductory clause: "Because the trail was muddy, we wore boots."',
    },
    'Periods': {
      what: 'A period ends a declarative or imperative sentence — any sentence that makes a statement, gives information, or issues a command.',
      why: 'Periods establish sentence boundaries and prevent run-on sentences. TEKS 6th Grade classifies fragments, run-ons, and comma splices as hard errors, so clear sentence endings are essential.',
      howToUse: 'Every complete sentence that is not a question or exclamation ends with a period. Double-check that each sentence contains at least one independent clause (a subject + verb expressing a complete thought).',
      exampleSnippet: 'Statement: "The experiment produced unexpected results."\nCommand: "Open your textbook to page forty-two."',
    },
    'Question marks': {
      what: 'A question mark signals that a sentence is asking for information or posing a thought-provoking question to the reader.',
      why: 'Using questions strategically engages the reader and adds variety to your writing. TEKS 6th Grade expects correct end punctuation and encourages sentence variety.',
      howToUse: 'Use question marks for:\n• Direct questions: "What caused the Civil War?"\n• Rhetorical questions (to make a point): "Isn\'t it time we took action?"\nDo NOT use a question mark after an indirect question: "She asked whether we were ready."',
      exampleSnippet: 'Rhetorical: "How many chances do we get to make a first impression?"\nIndirect (no question mark): "I wondered why the sky was so red."',
    },
    'Apostrophes': {
      what: 'Apostrophes indicate possession or mark missing letters in contractions. At this level, pay attention to plural possessives and the difference between "its" and "it\'s."',
      why: 'Misused apostrophes are one of the most common errors. TEKS 6th Grade expects mastery of possessives (singular and plural) and contractions, including commonly confused forms.',
      howToUse: 'Singular possessive: add \'s — "the teacher\'s desk."\nPlural possessive (plural already ends in s): add just an apostrophe — "the students\' projects."\nContractions: apostrophe replaces missing letters — "they are" → "they\'re."\nRemember: "its" = belonging to it; "it\'s" = it is.',
      exampleSnippet: 'Singular: "The captain\'s decision changed the game."\nPlural: "The players\' uniforms were muddy."\nContraction: "It\'s going to be a great day." (it is)',
    },
    'Quotation marks': {
      what: 'Quotation marks enclose the exact words someone speaks or a direct quote from a source. They also set off titles of short works (poems, articles, chapters).',
      why: 'Proper quotation mark use shows the reader exactly which words are quoted versus your own. TEKS 6th Grade expects correct punctuation placement with quotation marks.',
      howToUse: 'Place commas and periods inside closing quotation marks. Start a new paragraph for each new speaker in dialogue. Use single quotation marks for a quote within a quote.',
      exampleSnippet: '"The most important thing," said Coach, "is teamwork."\nShe said, "My favorite poem is \'The Road Not Taken.\'"',
    },
    'Capitalization': {
      what: 'Capitalization rules extend beyond sentence beginnings and proper nouns to include official titles of people, abbreviations, initials, acronyms, and organizations.',
      why: 'Correct capitalization signals proper nouns and formal titles, preventing ambiguity. TEKS 6th Grade adds official titles, abbreviations, and organizations to the capitalization expectations.',
      howToUse: 'Capitalize:\n• Sentence beginnings and the pronoun "I."\n• Proper nouns (names, places, specific events).\n• Official titles before names: "President Lincoln" but "the president spoke."\n• Acronyms and initialisms: NASA, FBI.\n• Languages, nationalities, races.',
      exampleSnippet: 'Correct: "Dr. Martinez spoke at the United Nations."\nIncorrect: "dr. martinez spoke at the united nations."',
    },
    'Subject-verb agreement': {
      what: 'Subject-verb agreement means the verb form matches the subject in number, even when phrases or clauses separate them.',
      why: 'At the 6th-grade level, subjects and verbs are often separated by prepositional phrases that can mislead you. TEKS 6th Grade specifically tests agreement in complex constructions with intervening phrases.',
      howToUse: 'Find the true subject by ignoring prepositional phrases between the subject and verb:\n• "The box of chocolates was delicious." (subject = box, not chocolates)\n• "The students in the hallway are waiting." (subject = students)',
      exampleSnippet: 'Correct: "A group of birds flies south every winter." (subject = group)\nIncorrect: "A group of birds fly south every winter."',
    },
    'Verb conjugation': {
      what: 'Verb conjugation involves using the correct tense consistently throughout your essay. At this level you should handle past, present, future, and present perfect forms.',
      why: 'Unintentional tense shifts confuse the reader about when events happen. TEKS 6th Grade flags inconsistent tense as an error.',
      howToUse: 'Choose a primary tense for your essay and maintain it. Shift tense only when the timeline genuinely changes. Watch for irregular past tenses: "brought" not "bringed," "taught" not "teached."',
      exampleSnippet: 'Consistent: "The scientist studied the samples. She recorded her findings and published a paper."\nInconsistent: "The scientist studied the samples. She records her findings." (shifts to present)',
    },
    'Pronoun-antecedent agreement': {
      what: 'Every pronoun must clearly refer back to a specific noun (its antecedent). At this level, use relative pronouns (who, that, which) correctly and ensure pronoun case in compounds.',
      why: 'Unclear pronoun reference makes writing ambiguous. TEKS 6th Grade requires clear antecedents, correct relative pronoun use, and proper case in compound subjects/objects.',
      howToUse: 'Make sure each pronoun has only one possible antecedent. Use "who" for people, "that/which" for things. In compound subjects, test by removing the other person: "She and I went" (correct — "I went"), not "Her and me went."',
      exampleSnippet: 'Clear: "When Maya finished the book, she wrote a review." (she → Maya)\nAmbiguous: "Maya told Jenna that she was late." (who was late?)',
    },
    'Coordinating conjunctions': {
      what: 'The seven coordinating conjunctions (FANBOYS: For, And, Nor, But, Or, Yet, So) connect words, phrases, or independent clauses of equal importance.',
      why: 'Using a variety of coordinating conjunctions shows sentence sophistication and helps you express contrasts, causes, and alternatives. TEKS 6th Grade expects at least four different coordinating conjunctions.',
      howToUse: 'Use each conjunction for its specific purpose:\n• for = because/reason\n• and = addition\n• nor = negative alternative\n• but = contrast\n• or = choice\n• yet = surprise contrast\n• so = result',
      exampleSnippet: '"The weather was freezing, yet the team practiced outside."\n"She didn\'t want pizza, nor did she want pasta."',
    },
    'Compound sentences': {
      what: 'A compound sentence joins two independent clauses with a comma + coordinating conjunction or with a semicolon.',
      why: 'Compound sentences show relationships between ideas and improve flow. TEKS 6th Grade requires correct compound sentences and treats comma splices and run-ons as hard errors.',
      howToUse: 'Method 1: [Independent clause], [FANBOYS] [independent clause].\nMethod 2: [Independent clause]; [independent clause].\nNever join two independent clauses with just a comma (comma splice) or no punctuation (run-on).',
      exampleSnippet: 'Correct: "The alarm rang, but nobody moved."\nComma splice (wrong): "The alarm rang, nobody moved."\nRun-on (wrong): "The alarm rang nobody moved."',
    },
    'Point of view': {
      what: 'Point of view determines the narrator\'s position. First person (I/we), second person (you), and third person (he/she/they) each create different effects.',
      why: 'Shifting point of view mid-essay disrupts the reader\'s experience. TEKS 6th Grade requires consistent point of view throughout.',
      howToUse: 'Select a point of view before you begin and maintain it in every sentence. If you\'re writing an informational essay, third person is usually best. For personal narratives, use first person.',
      exampleSnippet: 'Third person consistent: "The researchers conducted the study. They analyzed the data carefully."\nShift (wrong): "The researchers conducted the study. I analyzed the data carefully."',
    },
    'Dialogue formatting': {
      what: 'Dialogue formatting involves punctuating conversations correctly, using speaker tags, and starting new paragraphs for each new speaker.',
      why: 'Well-formatted dialogue makes conversations clear and engaging. TEKS 6th Grade requires correct quotation marks, punctuation, and paragraph breaks for dialogue.',
      howToUse: 'Follow these rules:\n• Quotation marks around spoken words.\n• Comma separates dialogue from the tag (inside the quotes).\n• New paragraph for each new speaker.\n• Capitalize the first word of dialogue.\n• End punctuation goes inside quotation marks.',
      exampleSnippet: '"I think we should take the shortcut," whispered Mia.\n"Are you sure it\'s safe?" asked Carlos.\n"Trust me. I\'ve done it before," she replied confidently.',
    },
    'Semicolons': {
      what: 'A semicolon ( ; ) connects two closely related independent clauses without using a conjunction. It signals a pause stronger than a comma but softer than a period.',
      why: 'Semicolons show that two ideas are so closely linked they belong together. TEKS 6th Grade introduces semicolons between independent clauses and flags incorrect usage (like joining a dependent clause to an independent clause with a semicolon).',
      howToUse: 'Place a semicolon between two independent clauses that are closely related in meaning. Both sides must be complete sentences on their own.\nDo NOT use a semicolon before a subordinating conjunction (because, although, when).',
      exampleSnippet: 'Correct: "The concert was sold out; we watched it online instead."\nIncorrect: "The concert was sold out; because too many people wanted tickets."',
    },
    'Colons': {
      what: 'A colon ( : ) introduces what comes next — a list, an explanation, or an elaboration. It says "here\'s what I mean."',
      why: 'Colons organize information clearly and signal the reader to pay attention to what follows. TEKS 6th Grade requires colons after independent clauses to introduce lists or explanations.',
      howToUse: 'The words before the colon must form a complete sentence. Then the colon introduces a list or explanation.\nDo NOT place a colon after an incomplete sentence.',
      exampleSnippet: 'List: "I need three things: a notebook, a pencil, and an eraser."\nExplanation: "There was one problem: the bridge was closed."\nWrong: "I need: a notebook, a pencil, and an eraser." (incomplete before the colon)',
    },
    'Parentheses': {
      what: 'Parentheses ( ) enclose supplementary information that adds context without being essential to the main sentence.',
      why: 'Parentheses let you include helpful details without disrupting the flow of your writing. TEKS 6th Grade introduces parentheses for supplementary information.',
      howToUse: 'Place extra information inside parentheses. The sentence should still make sense if you remove the parenthetical. Punctuation goes outside the closing parenthesis if the parenthetical is inside a sentence.',
      exampleSnippet: '"The capital of Texas (Austin) is known for its music scene."\n"The experiment took three weeks (not including setup time)."',
    },
    'Complex sentences': {
      what: 'A complex sentence has one independent clause and at least one dependent clause connected by a subordinating conjunction (because, although, when, if, since, while).',
      why: 'Complex sentences show cause-effect, time, and conditional relationships between ideas. TEKS 6th Grade requires writing complex sentences using subordinating conjunctions.',
      howToUse: 'An independent clause can stand alone. A dependent clause starts with a subordinating conjunction and cannot stand alone.\n• Dependent clause first → comma: "Although it rained, we played outside."\n• Independent clause first → no comma: "We played outside although it rained."',
      exampleSnippet: '"Because the trail was steep, the hikers took frequent breaks."\n"The hikers took frequent breaks because the trail was steep."',
    },
    'Subordinating conjunctions': {
      what: 'Subordinating conjunctions (because, although, when, if, since, while, unless, after, before) begin dependent clauses and show relationships like cause, time, or condition.',
      why: 'They allow you to express complex relationships between ideas in a single sentence. TEKS 6th Grade expects students to use subordinating conjunctions to build complex sentences.',
      howToUse: 'Place the subordinating conjunction at the start of the less important idea (the dependent clause). If the dependent clause comes first, follow it with a comma. If it comes second, usually no comma is needed.',
      exampleSnippet: '"While the bread was baking, the chef prepared the salad." (dependent clause first → comma)\n"The chef prepared the salad while the bread was baking." (dependent clause second → no comma)',
    },
    'Transitional phrases': {
      what: 'Transitional phrases are words or short phrases that connect ideas between sentences or paragraphs. They guide the reader through your argument or narrative.',
      why: 'Without transitions, writing feels choppy and disconnected. TEKS 6th Grade requires transitional phrases to connect ideas logically.',
      howToUse: 'Choose the right transition for the relationship:\n• Addition: "in addition," "furthermore," "also"\n• Contrast: "however," "on the other hand," "nevertheless"\n• Cause/effect: "therefore," "consequently," "as a result"\n• Example: "for example," "for instance," "specifically"\nFollow most transitions with a comma.',
      exampleSnippet: '"The team practiced daily. As a result, they won the championship."\n"The movie was entertaining; however, the ending was predictable."',
    },
    'Active vs. passive voice': {
      what: 'In active voice, the subject performs the action ("The dog chased the cat"). In passive voice, the subject receives the action ("The cat was chased by the dog").',
      why: 'Active voice is usually clearer and more direct. Passive voice has its place (when the doer is unknown or unimportant) but excessive use weakens writing. TEKS 6th Grade introduces active vs. passive voice awareness.',
      howToUse: 'Default to active voice — it\'s stronger and more concise. Use passive voice intentionally:\n• When the doer is unknown: "The window was broken."\n• When the action matters more than the doer: "The law was passed in 1964."',
      exampleSnippet: 'Active: "The scientist discovered a new species."\nPassive: "A new species was discovered by the scientist."\nGood passive: "The package was delivered this morning." (doer unimportant)',
    },
    'Parallel structure': {
      what: 'Parallel structure means using the same grammatical pattern for items in a list, comparison, or paired construction.',
      why: 'Parallel structure makes writing rhythmic, clear, and professional. Non-parallel lists sound awkward. TEKS 6th Grade introduces parallel structure in simple series.',
      howToUse: 'Make sure all items in a list or comparison follow the same form:\n• All nouns, all verbs, all phrases, or all clauses.\n• Check by reading each item after the introductory words.',
      exampleSnippet: 'Parallel: "She likes swimming, hiking, and biking." (all gerunds)\nNot parallel: "She likes swimming, hiking, and to bike." (mixes gerund and infinitive)',
    },
  },

  proficient: {
    'Commas': {
      what: 'At the mastery level, comma usage extends to distinguishing restrictive from nonrestrictive clauses — a critical skill that changes meaning.',
      why: 'Misplaced commas around clauses alter meaning (compare "students who study pass" vs. "students, who study, pass"). TEKS 9th Grade treats comma errors in restrictive/nonrestrictive contexts as significant.',
      howToUse: 'Nonrestrictive clause (extra info, removable): set off with commas — "My brother, who lives in Austin, is visiting."\nRestrictive clause (essential to meaning): no commas — "Students who study regularly tend to succeed."\nAlso use commas after introductory elements, in compound/complex sentences, and in series.',
      exampleSnippet: 'Restrictive: "The novel that won the award is on the shelf." (identifies which novel)\nNonrestrictive: "The novel, which won the award, is on the shelf." (adds info about a known novel)',
    },
    'Periods': {
      what: 'Periods end declarative and imperative sentences. At the mastery level, sentence boundary errors (fragments, run-ons, comma splices) carry zero tolerance.',
      why: 'Fragments and run-ons indicate a fundamental misunderstanding of sentence structure. TEKS 9th Grade classifies these as serious foundational errors.',
      howToUse: 'Ensure every period follows a complete independent clause. Before submitting, scan each sentence for a subject and a finite verb. If a "sentence" starts with a subordinating conjunction and has no independent clause, it is a fragment.',
      exampleSnippet: 'Fragment: "Because the experiment failed." (dependent clause alone — no independent clause)\nCorrect: "The team regrouped because the experiment failed."',
    },
    'Question marks': {
      what: 'Question marks end direct questions. At this level, distinguish between direct and indirect questions, and deploy rhetorical questions strategically.',
      why: 'Using questions effectively engages the reader and demonstrates rhetorical awareness. TEKS 9th Grade expects varied sentence types and purposeful punctuation.',
      howToUse: 'Direct question: "What drove the protagonist\'s decision?"\nIndirect question (no question mark): "The essay explores what drove the protagonist\'s decision."\nRhetorical question: use sparingly to provoke thought or emphasize a point.',
      exampleSnippet: 'Rhetorical: "Can a society that ignores its history truly progress?"\nIndirect: "One must ask whether progress is possible without historical awareness."',
    },
    'Apostrophes': {
      what: 'Apostrophes mark possession and contraction. At the mastery level, handle joint vs. separate possession, possessives of singular nouns ending in -s, and avoid common errors.',
      why: 'Apostrophe errors are among the most visible mechanical mistakes. TEKS 9th Grade expects flawless apostrophe use as a foundational skill.',
      howToUse: 'Singular ending in -s: "James\'s essay" (preferred in most style guides).\nJoint possession: "Sam and Jordan\'s project" (one shared project).\nSeparate possession: "Sam\'s and Jordan\'s projects" (two different projects).\nNever use apostrophes for plurals: "the 1990s" not "the 1990\'s."',
      exampleSnippet: 'Joint: "Ben and Maya\'s presentation earned top marks."\nSeparate: "Ben\'s and Maya\'s presentations covered different topics."',
    },
    'Quotation marks': {
      what: 'Quotation marks enclose direct speech, direct quotes from sources, and titles of short works. At this level, integrate quotations smoothly and handle punctuation precisely.',
      why: 'Precise quotation integration reflects academic writing competence. TEKS 9th Grade expects mastery of quotation conventions.',
      howToUse: 'Integrate quotes with signal phrases: "According to Smith, \'…\'" Place commas and periods inside closing quotes. Place colons and semicolons outside. Use block quotes for passages of four or more lines (indent, no quotation marks).',
      exampleSnippet: 'Integrated: As Morrison argues, "the function of freedom is to free someone else."\nWith brackets: "The results [of the study] were inconclusive."',
    },
    'Capitalization': {
      what: 'Capitalization covers proper nouns, titles, acronyms, and stylistic conventions. At the mastery level, handle title case, capitalize movement and era names, and maintain consistency.',
      why: 'Incorrect capitalization in formal writing signals carelessness. TEKS 9th Grade expects all prior capitalization rules to be mastered.',
      howToUse: 'Capitalize:\n• Proper nouns and adjectives (Shakespearean, Victorian).\n• Titles before names but not after: "Senator Cruz" vs. "the senator."\n• Specific courses: "Algebra II" but "a math class."\n• Historical periods and movements: "the Renaissance," "Romanticism."',
      exampleSnippet: 'Correct: "During the Romantic period, poets like Wordsworth celebrated nature."\nIncorrect: "During the romantic period, Poets like wordsworth celebrated Nature."',
    },
    'Subject-verb agreement': {
      what: 'Subject-verb agreement at the mastery level includes complex constructions: intervening phrases, inverted sentences, collective nouns with varying meaning, and indefinite pronouns.',
      why: 'Advanced agreement errors undermine credibility. TEKS 9th Grade has very low tolerance for subject-verb disagreement in any construction.',
      howToUse: 'Strategies:\n• Mentally remove intervening phrases to find the true subject.\n• In inverted sentences ("There are many reasons…"), identify the real subject after the verb.\n• Collective nouns: "The team is" (acting as one) vs. "The team are" (acting individually).\n• Indefinite pronouns: "each," "everyone," "nobody" are singular; "both," "few," "many" are plural.',
      exampleSnippet: 'Inverted: "Among the ruins were several artifacts." (subject = artifacts)\nCollective: "The jury has reached its verdict." (acting as one unit)',
    },
    'Verb conjugation': {
      what: 'Verb conjugation at the mastery level requires consistent tense across multiple paragraphs, correct use of perfect tenses, and awareness of the subjunctive mood.',
      why: 'Tense inconsistency across paragraphs is a significant error in sustained writing. TEKS 9th Grade expects tense consistency and introduces the subjunctive mood.',
      howToUse: 'Maintain your primary tense throughout. Use perfect tenses to show completed actions relative to another time: "By the time we arrived, the show had ended." Use the subjunctive for hypotheticals and formal conditionals: "If I were…" not "If I was…"',
      exampleSnippet: 'Subjunctive: "If she were to accept the position, the department would benefit."\nPast perfect: "The artist had envisioned the piece long before she painted it."',
    },
    'Pronoun-antecedent agreement': {
      what: 'At the mastery level, pronoun reference must be unambiguous even in complex multi-clause sentences. Handle who/whom and maintain clarity across paragraphs.',
      why: 'Ambiguous pronouns in sophisticated writing create confusion. TEKS 9th Grade expects pronoun reference clarity in complex multi-clause sentences.',
      howToUse: 'Reread every pronoun and verify its antecedent is obvious. In sentences with multiple possible antecedents, repeat the noun instead of using a pronoun. Use "who" for subjects and "whom" for objects.',
      exampleSnippet: 'Ambiguous: "When the officer spoke to the witness, he seemed nervous." (who was nervous?)\nClear: "When the officer spoke to the witness, the witness seemed nervous."',
    },
    'Coordinating conjunctions': {
      what: 'Coordinating conjunctions (FANBOYS) connect grammatically equal elements. At the mastery level, use all seven purposefully and punctuate correctly in every context.',
      why: 'Using coordinating conjunctions precisely in compound sentences, parallel lists, and paired constructions demonstrates syntactic control. TEKS 9th Grade expects mastery of all compound sentence conventions.',
      howToUse: 'Comma before a coordinating conjunction only when joining two independent clauses. No comma when joining two words or phrases: "bread and butter" (no comma). Choose the conjunction that best expresses the logical relationship.',
      exampleSnippet: 'Two clauses (comma): "The theory was elegant, yet the evidence was inconclusive."\nTwo phrases (no comma): "She excelled in both academics and athletics."',
    },
    'Compound sentences': {
      what: 'Compound sentences join two or more independent clauses. At the mastery level, vary your joining methods (comma + conjunction, semicolon, semicolon + conjunctive adverb) and avoid monotony.',
      why: 'Over-reliance on one sentence pattern weakens writing. TEKS 9th Grade flags monotonous sentence patterns as an error and expects varied structures.',
      howToUse: 'Alternate between:\n• Comma + FANBOYS: "The data was clear, so the team moved forward."\n• Semicolon: "The data was clear; the team moved forward."\n• Semicolon + conjunctive adverb: "The data was clear; therefore, the team moved forward."',
      exampleSnippet: 'Varied: "The hypothesis was confirmed, and new questions emerged; however, funding remained uncertain."',
    },
    'Point of view': {
      what: 'Point of view at the mastery level involves maintaining a consistent narrative perspective, register, and tone throughout the entire essay — across multiple paragraphs.',
      why: 'Shifts in register or perspective undermine the essay\'s coherence and authority. TEKS 9th Grade requires consistent register and tone throughout.',
      howToUse: 'In formal essays, use third person and maintain an academic register. Avoid sudden shifts to "you" or "I" unless the essay\'s purpose calls for it. Keep the level of formality consistent from introduction to conclusion.',
      exampleSnippet: 'Consistent: "One might argue that the policy has merit. However, the evidence suggests otherwise."\nShift (wrong): "One might argue that the policy has merit. But honestly, I think it\'s terrible."',
    },
    'Dialogue formatting': {
      what: 'Dialogue formatting at the mastery level includes correct punctuation, paragraph breaks, varied dialogue tags, and embedding action beats within dialogue.',
      why: 'In fiction and creative nonfiction, well-formatted dialogue drives narrative. TEKS 9th Grade expects all prior dialogue conventions to be mastered.',
      howToUse: 'Vary your approach:\n• Standard tag: "I understand," she said.\n• Action beat (no comma, period instead): "I understand." She leaned forward.\n• Interrupted dialogue: "I thought we could—"\n• Embedded action: "I think," he said, pausing to choose his words, "we need a new approach."',
      exampleSnippet: '"The evidence is conclusive." Dr. Patel set down the report. "We need to publish these findings immediately."\n"But what about peer review?" asked her colleague.',
    },
    'Semicolons': {
      what: 'Semicolons join closely related independent clauses and precede conjunctive adverbs (however, therefore, moreover) followed by a comma.',
      why: 'Semicolons demonstrate syntactic sophistication and are tested at the mastery level. TEKS 9th Grade expects semicolons between independent clauses and before conjunctive adverbs.',
      howToUse: 'Two uses:\n1. Between related independent clauses: "The experiment failed; the team revised their approach."\n2. Before a conjunctive adverb: "The data was compelling; however, the sample size was small."\nDo NOT use a semicolon before "because," "although," or other subordinating conjunctions.',
      exampleSnippet: 'Correct: "The novel explores identity; moreover, it challenges societal norms."\nIncorrect: "The novel explores identity; because the author experienced displacement."',
    },
    'Colons': {
      what: 'Colons introduce lists, explanations, amplifications, or quotations after an independent clause. At the mastery level, use them for rhetorical emphasis.',
      why: 'A well-placed colon builds anticipation and delivers key information with impact. TEKS 9th Grade expects mastery of colon conventions.',
      howToUse: 'The clause before the colon must be a complete sentence. Use colons to:\n• Introduce a list: "Three factors contributed: funding, leadership, and timing."\n• Amplify: "She had one goal: victory."\n• Introduce a quotation: The author states: "Knowledge is power."',
      exampleSnippet: 'Amplification: "The conclusion was inescapable: the system needed reform."\nWrong: "The main causes are: poverty, inequality, and corruption." (incomplete clause before colon)',
    },
    'Parentheses': {
      what: 'Parentheses enclose supplementary information, asides, or citations. At the mastery level, use them judiciously — overuse clutters prose.',
      why: 'Parentheses signal that information is helpful but not essential. TEKS 9th Grade expects all prior parenthetical conventions to be mastered.',
      howToUse: 'Use parentheses for:\n• Clarifying details: "The study (conducted in 2023) confirmed the hypothesis."\n• Acronyms on first use: "The World Health Organization (WHO)…"\n• In-text citations: "(Smith, 2024)."\nKeep parenthetical content brief.',
      exampleSnippet: '"The phenomenon (first documented by Curie in 1898) remains relevant to modern physics."',
    },
    'Complex sentences': {
      what: 'Complex sentences pair an independent clause with one or more dependent clauses. At the mastery level, embed multiple dependent clauses and vary their position.',
      why: 'Complex sentences express nuanced relationships (cause, condition, time, concession). TEKS 9th Grade expects varied sentence structures including complex constructions.',
      howToUse: 'Place dependent clauses at the beginning (with comma), end (usually no comma), or even in the middle (set off by commas if nonrestrictive). Use a range of subordinating conjunctions to show different relationships.',
      exampleSnippet: 'Beginning: "Although the evidence was circumstantial, the jury reached a unanimous verdict."\nMiddle: "The policy, because it lacked public support, was eventually repealed."\nEnd: "The team celebrated after they secured the championship."',
    },
    'Subordinating conjunctions': {
      what: 'Subordinating conjunctions introduce dependent clauses and establish logical relationships. At the mastery level, select the most precise conjunction for each context.',
      why: 'Choosing the right subordinating conjunction sharpens meaning. "Although" and "because" create very different relationships. TEKS 9th Grade expects precise subordination in varied sentence structures.',
      howToUse: 'Match the conjunction to the relationship:\n• Cause: because, since\n• Concession: although, even though\n• Condition: if, unless, provided that\n• Time: when, while, before, after, until\n• Purpose: so that, in order that',
      exampleSnippet: 'Concession: "Even though the data was limited, the researchers drew meaningful conclusions."\nCondition: "Unless the committee approves the budget, the project will be delayed."',
    },
    'Transitional phrases': {
      what: 'Transitional phrases create logical bridges between sentences and paragraphs. At the mastery level, vary your transitions and use them to build a coherent argument.',
      why: 'Repetitive transitions ("also," "also," "also") weaken prose. TEKS 9th Grade expects sophisticated transitional language and logical flow across paragraphs.',
      howToUse: 'Use transitions that reflect the precise logical relationship:\n• Concession: "admittedly," "granted"\n• Emphasis: "indeed," "in fact," "above all"\n• Sequence: "subsequently," "meanwhile," "ultimately"\n• Summary: "in essence," "to summarize"\nVary your choices — never repeat the same transition within a paragraph.',
      exampleSnippet: '"The initial results were promising. Subsequently, the team expanded the study to include a larger cohort. Ultimately, the data confirmed their hypothesis."',
    },
    'Active vs. passive voice': {
      what: 'Active voice emphasizes the agent; passive voice emphasizes the action or recipient. At the mastery level, deploy each intentionally based on rhetorical purpose.',
      why: 'Excessive passive voice obscures the actor and weakens prose. TEKS 9th Grade expects active voice as the default and intentional, justified use of passive.',
      howToUse: 'Use active voice for clarity and directness: "The committee approved the proposal."\nUse passive when:\n• The agent is unknown: "The artifact was discovered in 1922."\n• The agent is less important than the action: "The law was enacted to protect civil rights."\n• Scientific conventions call for it: "The solution was heated to 100°C."',
      exampleSnippet: 'Intentional passive: "The Constitution was ratified in 1788." (focus on the document, not the ratifiers)\nWeak passive: "The ball was thrown by the pitcher." → Better: "The pitcher threw the ball."',
    },
    'Parallel structure': {
      what: 'Parallel structure means items in a list, comparison, or correlative construction follow the same grammatical pattern. At the mastery level, apply parallelism in complex series and correlative conjunctions.',
      why: 'Non-parallel constructions are jarring and indicate a lack of syntactic control. TEKS 9th Grade expects parallel structure in complex series, comparisons, and correlative pairs.',
      howToUse: 'Ensure parallelism in:\n• Lists: all nouns, all gerunds, all infinitives, or all clauses.\n• Comparisons: "more…than," "as…as" — both sides match.\n• Correlative conjunctions: "not only…but also," "either…or" — what follows each word must be the same form.',
      exampleSnippet: 'Parallel: "The program not only improved literacy rates but also reduced dropout numbers."\nNot parallel: "The program not only improved literacy rates but also there were fewer dropouts."',
    },
    'Hyphens': {
      what: 'Hyphens join compound modifiers before a noun, clarifying that two words function as a single adjective. They also appear in certain compound words and spelled-out numbers.',
      why: 'Missing hyphens can change meaning: "a small business owner" vs. "a small-business owner." TEKS 9th Grade expects hyphens in compound modifiers before nouns.',
      howToUse: 'Hyphenate compound adjectives before a noun: "well-known author," "high-quality research."\nDo NOT hyphenate after the noun: "The author is well known."\nDo NOT hyphenate when the first word is an adverb ending in -ly: "a highly regarded study."',
      exampleSnippet: 'Before noun: "a thought-provoking essay"\nAfter noun: "The essay was thought provoking." (no hyphen)\nWith -ly: "a widely recognized phenomenon" (no hyphen)',
    },
    'Dashes (em dash, en dash)': {
      what: 'An em dash (—) sets off parenthetical information or creates dramatic emphasis. An en dash (–) indicates a range of numbers, dates, or scores.',
      why: 'Em dashes add emphasis that commas and parentheses cannot match. TEKS 9th Grade introduces em dashes for emphasis and flags overuse as a soft error.',
      howToUse: 'Em dash — use to:\n• Set off a dramatic aside: "The verdict — guilty on all counts — shocked the courtroom."\n• Create emphasis: "She had one ambition — to change the world."\nEn dash – use for ranges: "pages 12–45," "the 2020–2021 season."\nLimit em dashes to 1–2 per essay to avoid overuse.',
      exampleSnippet: 'Em dash: "The discovery — one that would reshape the field — was published quietly."\nEn dash: "The Civil War (1861–1865) transformed the nation."',
    },
    'Brackets': {
      what: 'Brackets [ ] insert clarifying or contextual information into a direct quotation without altering the original words.',
      why: 'Brackets allow you to integrate quotations smoothly into your own sentences while preserving the integrity of the original source. TEKS 9th Grade expects mastery of quotation conventions.',
      howToUse: 'Use brackets to:\n• Add context: "He [Lincoln] delivered the address at Gettysburg."\n• Adjust grammar: "The report states that \'[the] findings were inconclusive.\'"\n• Indicate changes: use [sic] after an error in the original to show it\'s not yours.',
      exampleSnippet: 'Clarification: "The author argues that \'[the Industrial Revolution] fundamentally altered social structures.\'"\n[sic]: "The letter read, \'We are greatful [sic] for your support.\'"',
    },
    'Ellipses': {
      what: 'An ellipsis (…) indicates omitted words from a quotation or a trailing, unfinished thought.',
      why: 'Ellipses allow you to shorten quotations to include only the most relevant parts while signaling that material has been removed. TEKS 9th Grade expects ellipses for omission in quotations.',
      howToUse: 'For omitted words in a quote: place the ellipsis where words are removed. If the omission spans a sentence boundary, include a period before the ellipsis (four dots).\nFor a trailing thought in creative writing: "I thought maybe…" — use sparingly.',
      exampleSnippet: 'Omission: "We hold these truths … that all men are created equal."\nFour-dot: "The committee proposed several reforms…. However, none were adopted."',
    },
    'Modifiers': {
      what: 'Modifiers are words or phrases that describe, clarify, or add detail. Dangling and misplaced modifiers occur when a descriptive phrase doesn\'t clearly attach to the word it modifies.',
      why: 'Dangling modifiers create unintentionally absurd sentences. TEKS 9th Grade specifically flags dangling and misplaced modifiers.',
      howToUse: 'Place modifiers directly next to the word they describe. After writing a sentence that begins with a modifying phrase, check: does the subject of the main clause match who/what the phrase describes?',
      exampleSnippet: 'Dangling: "Walking through the forest, the trees towered above." (the trees aren\'t walking)\nCorrect: "Walking through the forest, I gazed at the towering trees."',
    },
    'Compound-complex sentences': {
      what: 'A compound-complex sentence contains at least two independent clauses and one or more dependent clauses. It is the most sophisticated sentence structure.',
      why: 'Compound-complex sentences demonstrate advanced syntactic control and allow you to express multiple related ideas with nuance. TEKS 9th Grade expects varied sentence structures including compound-complex constructions.',
      howToUse: 'Combine the rules of compound and complex sentences:\n[Independent clause], [conjunction] [independent clause] [dependent clause].\nOr: [Dependent clause], [independent clause], [conjunction] [independent clause].',
      exampleSnippet: '"Although the evidence was contested, the prosecution built a strong case, and the jury deliberated for only two hours."\n(1 dependent clause + 2 independent clauses)',
    },
    'Paragraph structure': {
      what: 'Paragraph structure means each paragraph serves a distinct purpose with a clear topic sentence, supporting details, and a concluding or transitional sentence.',
      why: 'Well-structured paragraphs are the building blocks of coherent essays. TEKS 9th Grade expects sustained, organized multi-paragraph writing.',
      howToUse: 'Each paragraph should:\n1. Open with a topic sentence that states the paragraph\'s main point.\n2. Develop the point with evidence, examples, or analysis (2–4 sentences).\n3. Close with a sentence that reinforces the point or transitions to the next paragraph.\nAvoid paragraph sprawl — one main idea per paragraph.',
      exampleSnippet: 'Topic sentence: "Urban green spaces provide measurable mental health benefits."\nSupport: evidence from studies, statistics, expert quotes.\nClosing: "Given these findings, investment in parks should be a public health priority."',
    },
    'Topic sentences': {
      what: 'A topic sentence is the first sentence of a paragraph that states its main idea and signals what the paragraph will discuss.',
      why: 'Topic sentences orient the reader and keep each paragraph focused. They also help you, the writer, stay organized. TEKS 9th Grade expects clear topic sentences in multi-paragraph compositions.',
      howToUse: 'Write the topic sentence before the supporting details. It should:\n• State the paragraph\'s main claim or point.\n• Connect to the thesis statement.\n• Be specific enough to guide the paragraph but broad enough to be developed.',
      exampleSnippet: 'Effective: "Social media has fundamentally altered how teenagers form friendships."\nToo vague: "Social media is interesting."\nToo narrow: "Instagram was founded in 2010."',
    },
    'Thesis statements': {
      what: 'A thesis statement is a single sentence, usually at the end of the introduction, that presents the essay\'s central argument or purpose.',
      why: 'The thesis is the backbone of the essay — every body paragraph should support it. TEKS 9th Grade expects a clear, arguable thesis in persuasive and analytical writing.',
      howToUse: 'A strong thesis:\n• Takes a clear position (not a fact or obvious statement).\n• Is specific enough to be supported in a short essay.\n• Previews the essay\'s structure or reasoning.\nAvoid announcements: "In this essay I will discuss…"',
      exampleSnippet: 'Strong: "Mandatory community service requirements in high schools build civic responsibility while providing students with real-world skills."\nWeak: "Community service is a good thing."',
    },
    'Metaphors and similes': {
      what: 'Metaphors make direct comparisons ("time is a thief"), while similes use "like" or "as" ("time moves like a river"). Both make abstract ideas vivid and concrete.',
      why: 'Figurative language elevates prose and engages the reader\'s imagination. TEKS 9th Grade values stylistic sophistication in student writing.',
      howToUse: 'Use metaphors and similes to:\n• Make abstract concepts tangible: "Prejudice is a wall between communities."\n• Create vivid imagery: "The city buzzed like a hive."\n• Enhance tone: choose comparisons that match the essay\'s mood.\nAvoid clichés — create original comparisons.',
      exampleSnippet: 'Metaphor: "The courtroom was a theater, and the lawyers were its actors."\nSimile: "The tension in the room hung like smoke after a fire."',
    },
    'Citation styles': {
      what: 'Citation styles provide a standardized way to credit sources within your text. Common formats include MLA (author page), APA (author, year), and Chicago.',
      why: 'Proper citation prevents plagiarism and allows readers to verify your sources. TEKS 9th Grade introduces in-text citation as a writing convention.',
      howToUse: 'For in-text citations, include the author\'s last name and a locator:\n• MLA: (Smith 42)\n• APA: (Smith, 2024)\nPlace the citation after the quote or paraphrase but before the period. Be consistent — use the same format throughout.',
      exampleSnippet: 'MLA: According to one study, "reading improves empathy" (Johnson 117).\nAPA: Research suggests that reading improves empathy (Johnson, 2023).',
    },
  },
}
