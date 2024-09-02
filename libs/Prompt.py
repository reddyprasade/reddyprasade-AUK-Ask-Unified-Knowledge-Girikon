CONDENSE_QUESTION_PROMPT = """Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:"""

QA_PROMPT = """Use the following pieces of context to answer the question at the end, Please Make sure answer comes from the given context only. If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}

Helpful and Descriptive Answer:"""

QA_PROMPT_GEMINI = """Use the following pieces of context to answer the question at the end, Please Make sure answer comes from the given context only. If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
The answer should be below json format only.
{"answer" : ""}
"""
# """, Please Make sure answer comes from the given context and do not add \"According to the provided context\" text in answer or reply"""