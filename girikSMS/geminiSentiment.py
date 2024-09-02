import bson
import google.generativeai as genai
import json

def handle_request_Gemini(user_id, user_text, ph, customer_name, agentName,supportEmail,feedBackURL,GEMINI_API_KEY):
    sentiment = analyze_sentiment_Gemini(user_text,GEMINI_API_KEY)
    print("HR : Line 15")
    thread_id = str(bson.ObjectId())
    print("HR : Line 18")
    if sentiment == "negative":
        follow_up_text = generate_follow_up_gemini(user_text, sentiment, customer_name,ph,agentName,supportEmail,feedBackURL,GEMINI_API_KEY)
        return thread_id, follow_up_text
    else:
        follow_up_text = generate_follow_up_gemini(user_text, sentiment, customer_name,ph,agentName,supportEmail,feedBackURL,GEMINI_API_KEY)
        return thread_id, follow_up_text
    


def analyze_sentiment_Gemini(text: str,GEMINI_API_KEY: str,model: str = "gemini-1.5-flash"):
    genai.configure(api_key = GEMINI_API_KEY)
    modelGemini = genai.GenerativeModel(model,
                                generation_config={"response_mime_type": "application/json",
                                                    "temperature": 0.1})
    prompt = """
    Analyze the sentiment of the following text and respond with only 'positive' or 'negative' in the below shared json format.
    {text}
    ```json
    {{
    "ANSWER": "Positive Or Negative"
    }}
    """.format(text = text)
    response = modelGemini.generate_content(prompt)
    result = response.text
    result = json.loads(result)
    sentiment = result["ANSWER"]
    return sentiment


def generate_follow_up_gemini(user_text, sentiment, customer_name,ph,agentName,supportEmail,feedBackURL,GEMINI_API_KEY, model: str = "gemini-1.5-flash"):
    genai.configure(api_key = GEMINI_API_KEY)
    modelGemini = genai.GenerativeModel(model,
                                generation_config={"response_mime_type": "application/json",
                                                    "temperature": 0.1})
    if sentiment == "negative":
        prompt = f"""
        You are an Intelligent AI assistant {agentName} named AI SMS which will be addressing queries of customer after giving the property valuation. Always initiate the conversation properly considering the {user_text}.
        If the customer is initialing the chat with Hi, Hello Etc. Then greet the customer in a polite way.
        If the customer is not happy and asking for help then consider the below scenario.
    
        On the basis of the intelligence ask the customer queries and handle the queries on the basis of information shared below. If the customer asking queries which were not present in the below shared information, then handle the queries on the basis of your intelligence.
        The valuation is already given by the sales agent. The customer is not satisfied with the valuation. Your role is to address the queries properly in a polite way.
        Customer name is {customer_name}. Feedback link is {feedBackURL}. Support mail ID is {supportEmail}. Support contact number is {ph}

        Make sure to address all the query of the user before saying we have inform the valuation team or valuator team.
        Whenever customer raise any concern or raise a new request, answer that the valuation team is been informed and they will get back to you shortly.
        Never generate the same answer again and again in the same conversation. It will give bad impact. Try to regenerate the answer by asking the user all the issues faced.
        
        Customer queries is shared below.
        {user_text}
        
        Use the below shared format to answer the customer queries.
        
        ```json
        {{
        "ANSWER": "Resolution to the customer queries."
        }}
        
        """
        response = modelGemini.generate_content(prompt)
        
    else:
        
        prompt = f"""
        You are an Intelligent AI assistant {agentName} named AI SMS which will be addressing queries of customer after giving the property valuation. 
        Always initiate the conversation properly considering the {user_text}
        If the customer is initialing the chat with Hi, Hello Etc. Then greet the customer in a polite way.
        If the customer is not happy and asking for help then consider the below scenario.
        
        On the basis of the intelligence ask the customer queries and handle the queries on the basis of information shared below. If the customer asking queries which were not present in the below shared information, then handle the queries on the basis of your intelligence.
        The valuation is already given by the sales agent. The customer is satisfied with the valuation. Your role
        is to address the queries properly in a polite way.
        

        Customer name is {customer_name}. Feedback link is {feedBackURL}. Support mail ID is {supportEmail}. Support contact number is {ph}
        
        
        Customer queries is shared below.
        
        {user_text}

        Use the below shared format to answer the customer queries.
        
        ```json
        {{
        "ANSWER": "Resolution to the customer queries."
        }}
        """
        response = modelGemini.generate_content(prompt)
    result = response.text
    result = json.loads(result)
    follow_up_text = result["ANSWER"]
    return follow_up_text