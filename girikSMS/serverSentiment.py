import threading
from dotenv import load_dotenv
from girikSMS.handle_request_thread import handle_request
from girikSMS.geminiSentiment import handle_request_Gemini
load_dotenv()

def getResponse(userID: str ,
                userText: str,
                supportNo: str,
                customerName: str,
                agentName: str,
                supportEmail: str,
                feedBackURL: str,
                modelName: str,
                OPENAI_API_KEY: str,
                GEMINI_API_KEY: str):
    if modelName == "chatgpt":
        _user_id = str(userID)
        user_text = userText
        support_ph = supportNo
        customer_name = customerName
        def target_function(_user_id, user_text, support_ph, customer_name, agentName,supportEmail,feedBackURL):
            
            thread_id, result = handle_request(_user_id, user_text, support_ph, customer_name,agentName,supportEmail,feedBackURL,OPENAI_API_KEY)
            return thread_id, result

        try:
            thread = threading.Thread(target=target_function, args=(_user_id, user_text, support_ph,customer_name,agentName,supportEmail,feedBackURL))
            thread.start()
            thread.join()
            thread_id, result = target_function(_user_id,user_text, support_ph,customer_name,agentName,supportEmail,feedBackURL)
            print(result)
            return {"result": result}
        except Exception as e:
            print(e)
            return {"error": str(e)}
    elif modelName == "gemini":
        _user_id = str(userID)
        user_text = userText
        support_ph = supportNo
        customer_name = customerName
        def target_function_gemini(_user_id, user_text, support_ph, customer_name, agentName,supportEmail,feedBackURL):
            
            thread_id, result = handle_request_Gemini(_user_id, user_text, support_ph, customer_name,agentName,supportEmail,feedBackURL, GEMINI_API_KEY)
            return thread_id, result
        try:
            thread = threading.Thread(target=target_function_gemini, args=(_user_id, user_text, support_ph,customer_name,agentName,supportEmail,feedBackURL))
            thread.start()
            thread.join()
            thread_id, result = target_function_gemini(_user_id,user_text, support_ph,customer_name,agentName,supportEmail,feedBackURL)
            print(result)
            return {"result": result}
        except Exception as e:
            print(e)
            return {"error": str(e)}
    else:
        return {"result": "Model Name is not selected"}
