import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from routes import chat_gpt_router
from functions import handle_cors

load_dotenv()

app = FastAPI(debug=bool(os.getenv("FAST_API_DEBUG", False)), log_level=None)

# handle cors middleware
handle_cors(app)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    headers = dict(request.scope['headers'])
    headers[b'custom-header'] = b'my custom header'
    request.scope['headers'] = [(k, v) for k, v in headers.items()]
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Add version to the root path
app.include_router(chat_gpt_router.router, prefix="/api/v2")
