from girikSMS.sentiment_analysis import analyze_sentiment
from girikSMS.followup import generate_follow_up
import bson

def handle_request(user_id, user_text, ph, customer_name, agentName,supportEmail,feedBackURL,OPENAI_API_KEY):
    sentiment = analyze_sentiment(user_text,OPENAI_API_KEY)
    print("HR : Line 15")
    thread_id = str(bson.ObjectId())
    print("HR : Line 18")
    if sentiment == "negative":
        follow_up_text = generate_follow_up(user_text, sentiment, customer_name,ph,agentName,supportEmail,feedBackURL,OPENAI_API_KEY)
        return thread_id, follow_up_text
    else:
        follow_up_text = generate_follow_up(user_text, sentiment, customer_name,ph,agentName,supportEmail,feedBackURL,OPENAI_API_KEY)
        return thread_id, follow_up_text

