import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def analyze_sentiment(text,OPENAI_API_KEY):
    client = OpenAI(api_key = OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        messages=[{"role": "system", "content": "Analyze the sentiment of the following text and respond with only 'positive' or 'negative'."},
                  {"role": "user", "content": text}]
    )
    sentiment = response.choices[0].message.content.strip().lower()
    return sentiment
