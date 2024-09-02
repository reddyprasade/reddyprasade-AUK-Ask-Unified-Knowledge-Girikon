import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

if __name__ == "__main__":
    uvicorn.run("driver:app",
                host=os.getenv("APP_HOST", "0.0.0.0"),
                port=int(os.getenv("APP_PORT") or 4458),
                reload=False,
                use_colors=True,
                access_log=True,
                log_level="info",
                forwarded_allow_ips="*",
                proxy_headers=True,
                headers=[
                    ("server", "Girikon AI")
                ]
                )