import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key = os.getenv("OPEN_AI_KEY"))


def generate_follow_up(text, sentiment, customer_name,ph,agentName,supportEmail,feedBackURL,OPENAI_API_KEY):
    client = OpenAI(api_key = OPENAI_API_KEY)
    if sentiment == "negative":
        prompt = f"""
        You are an Intelligent AI assistant {agentName} named AI SMS which will be addressing queries of customer after giving the property valuation. On the basis of the intelligence ask the customer queries and handle the queries on the basis of information shared below. If the customer asking queries which were not present in the below shared information, then handle the queries on the basis of your intelligence.
        The valuation is already given by the sales agent. The customer is not satisfied with the valuation. Your role
        is to address the queries properly in a polite way. Greet the customer properly if conversation start with Hi, Hello, etc.
        Customer name is {customer_name}. Feedback link is {feedBackURL}. Support mail ID is {supportEmail}. Support contact number is {ph}
        
        Make sure to address all the query of the user before saying we have inform the valuation team or valuator team.
        After considering the above example answer the query for the user response. Whenever customer raise any concern or raise a new request, answer that the valuation team is been informed and they will get back to you shortly.
        Never generate the same answer again and again in the same conversation. It will give bad impact. Try to regenerate the answer by asking the user all the issues faced.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system",
                 "content": prompt},
                {"role": "system", "content": text}
            ]
        )
    else:
        prompt = f"""
        You an AI assistant ChatBot named AI SMS which will be addressing queries of customer after giving the property valuation.
        The valuation is already given by the sales agent. The customer is not satisfied with the valuation. Your role
        is to address the queries properly in a polite way. Greet the customer properly if conversation start with Hi, Hello, etc.
        Customer name is {customer_name}. Feedback link is {feedBackURL}. Support mail ID is {supportEmail}. Support contact number is {ph}
        Make sure to address all the query of the user before saying we have inform the valuation team or valuator team.
        After considering the above example answer the query for the user response. Whenever customer raise any concern or raise a new request, answer that the valuation team is been informed and they will get back to you shortly.
        Never generate the same answer again and again in the same conversation. It will give bad impact. Try to regenerate the answer by asking the user all the issues faced.
        """
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system",
                 "content": prompt},
                {"role": "user", "content": text}
            ]
        )
    follow_up_text = response.choices[0].message.content.strip()
    return follow_up_text


