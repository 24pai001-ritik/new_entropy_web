import os
import io
import time
import logging
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from supabase import create_client, Client
import google.generativeai as genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("converse-backend")

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (like embed-script.js)
# Assuming main.py is in python_backend/ and embed-script.js is in the root
app.mount("/static", StaticFiles(directory=".."), name="static")

# Helper to serve embed-script.js specifically at the root level if needed
@app.get("/embed-script.js")
async def get_script():
    try:
        with open("../embed-script.js", "r") as f:
            return HTMLResponse(content=f.read(), media_type="application/javascript")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Script not found")

@app.get("/")
@app.get("/status")
async def health_check():
    return {"status": "online", "backend": "python/fastapi"}

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
# Accept both names for flexibility
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing Supabase credentials in environment")
    # Don't fail immediately, but endpoints will likely fail

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info(f"Supabase client initialized for {SUPABASE_URL}")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")

# Gemini setup
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    logger.info("Gemini API configured")
else:
    logger.warning("GEMINI_API_KEY missing")

# Models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[dict]] = None

def get_effective_owner_id(owner_id: str):
    if not owner_id or owner_id == "00000000-0000-0000-0000-000000000000":
        return None
    return owner_id

def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end == len(words):
            break
        start += (chunk_size - overlap)
    return chunks

async def generate_embedding(text: str) -> List[float]:
    try:
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Gemini Embedding Error: {e}")
        raise

@app.post("/upload-pdf")
async def upload_pdf(
    chatbot_name: str = Form(...),
    owner_id: str = Form("00000000-0000-0000-0000-000000000000"),
    files: List[UploadFile] = File(...)
):
    req_id = str(int(time.time()))[-6:]
    logger.info(f"[UPLOAD:{req_id}] Request received: {chatbot_name}")
    
    effective_owner_id = get_effective_owner_id(owner_id)
    
    try:
        # 1. Create Chatbot record
        logger.info(f"[UPLOAD:{req_id}] Creating chatbot record...")
        cb_response = supabase.table("chatbots").insert({
            "name": chatbot_name,
            "owner_id": effective_owner_id
        }).execute()
        
        if not cb_response.data:
            logger.error(f"[UPLOAD:{req_id}] Chatbot creation failed: {cb_response}")
            raise HTTPException(status_code=500, detail="Failed to create chatbot record")
        
        chatbot = cb_response.data[0]
        chatbot_id = chatbot['id']
        logger.info(f"[UPLOAD:{req_id}] Chatbot created: {chatbot_id}")

        for file in files:
            logger.info(f"[UPLOAD:{req_id}] Processing file: {file.filename}")
            content = await file.read()
            
            # Extract text from PDF
            try:
                pdf_reader = PdfReader(io.BytesIO(content))
                text = ""
                for page in pdf_reader.pages:
                    text += (page.extract_text() or "")
                logger.info(f"[UPLOAD:{req_id}] Extracted {len(text)} characters")
            except Exception as e:
                logger.error(f"[UPLOAD:{req_id}] PDF Extraction failed for {file.filename}: {e}")
                continue
            
            if not text.strip():
                logger.warning(f"[UPLOAD:{req_id}] No text found in {file.filename}")
                continue

            # Chunk text
            chunks = chunk_text(text)
            logger.info(f"[UPLOAD:{req_id}] Generated {len(chunks)} chunks")
            
            # 2. Create Document record
            doc_response = supabase.table("documents").insert({
                "chatbot_id": chatbot_id,
                "owner_id": effective_owner_id,
                "filename": file.filename
            }).execute()
            
            if not doc_response.data:
                logger.error(f"[UPLOAD:{req_id}] Document record creation failed")
                continue
                
            doc_id = doc_response.data[0]['id']
            
            # 3. Generate Embeddings and Save Chunks
            chunk_data = []
            for chunk in chunks:
                try:
                    embedding = await generate_embedding(chunk)
                    chunk_data.append({
                        "document_id": doc_id,
                        "chatbot_id": chatbot_id,
                        "content": chunk,
                        "embedding": embedding
                    })
                except Exception as e:
                    logger.error(f"[UPLOAD:{req_id}] Embedding generation failed for a chunk: {e}")
            
            if chunk_data:
                logger.info(f"[UPLOAD:{req_id}] Inserting {len(chunk_data)} chunks into Supabase")
                supabase.table("document_chunks").insert(chunk_data).execute()
                logger.info(f"[UPLOAD:{req_id}] Successfully stored chunks for {file.filename}")

        return {"message": "Chatbot created successfully", "chatbot_id": chatbot_id}

    except Exception as e:
        logger.error(f"[UPLOAD:{req_id}] Critical Error: {str(e)}")
        # If it's already an HTTPException, re-raise it
        if isinstance(e, HTTPException):
            raise e
        # Otherwise wrap it
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/{chatbot_id}")
async def chat(chatbot_id: str, request: ChatRequest):
    req_id = str(int(time.time()))[-6:]
    logger.info(f"[CHAT:{req_id}] Incoming message for bot {chatbot_id}")
    
    try:
        # 1. Generate query embedding
        query_embedding = await generate_embedding(request.message)
        
        # 2. Retrieve relevant chunks using RPC (match_documents)
        rpc_params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.1,
            "match_count": 5,
            "filter_chatbot_id": chatbot_id
        }
        chunks_response = supabase.rpc("match_document_chunks", rpc_params).execute()
        
        context = ""
        if chunks_response.data:
            context = "\n\n".join([c['content'] for c in chunks_response.data])
            logger.info(f"[CHAT:{req_id}] Found {len(chunks_response.data)} relevant chunks")
        else:
            logger.info(f"[CHAT:{req_id}] No relevant chunks found")

        # 3. Get Chatbot Info
        cb_response = supabase.table("chatbots").select("name").eq("id", chatbot_id).single().execute()
        chatbot_name = cb_response.data.get("name", "AI Assistant") if cb_response.data else "AI Assistant"

        # 4. Prepare History
        history_prompt = ""
        if request.history:
            history_prompt = "\n".join([f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}" for m in request.history])

        # 5. Generate Response
        # Using gemini-2.5-flash if available, or fallback to 1.5-flash
        model_name = "gemini-2.5-flash"
        try:
            model = genai.GenerativeModel(model_name)
            
            prompt = f"""You are {chatbot_name}. Answer based on context and history.
            
            Context: {context}
            History: {history_prompt}
            User: {request.message}
            """
            
            response = model.generate_content(prompt)
            answer = response.text
        except Exception as e:
            logger.error(f"[CHAT:{req_id}] Gemini generation error: {e}")
            raise HTTPException(status_code=500, detail=f"AI node error: {str(e)}")

        # 6. Save to history if session_id exists
        if request.session_id:
            try:
                supabase.table("chat_sessions").upsert({"id": request.session_id, "chatbot_id": chatbot_id}).execute()
                supabase.table("chat_messages").insert([
                    {"session_id": request.session_id, "role": "user", "content": request.message},
                    {"session_id": request.session_id, "role": "assistant", "content": answer}
                ]).execute()
            except Exception as e:
                logger.warning(f"[CHAT:{req_id}] Failed to save history: {e}")

        return {"answer": answer, "context_used": len(context) > 0}

    except Exception as e:
        logger.error(f"[CHAT:{req_id}] Error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chatbot/{chatbot_id}/embed")
async def get_embed_config(chatbot_id: str):
    try:
        response = supabase.table("chatbots").select("*").eq("id", chatbot_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/chatbot/{chatbot_id}/ui")
async def get_ui(chatbot_id: str):
    html_content = f"""
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                body {{ margin: 0; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; }}
                iframe {{ border: none; flex: 1; width: 100%; }}
            </style>
        </head>
        <body>
            <iframe src="http://localhost:3000/chatbot/{chatbot_id}"></iframe>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
