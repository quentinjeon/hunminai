from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
import uvicorn
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Docenty AI Worker",
    description="AI processing service for document validation and chat",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class DocumentAnalysisRequest(BaseModel):
    content: str
    security_level: Optional[str] = "일반"
    document_type: Optional[str] = "일반문서"

class ChatRequest(BaseModel):
    message: str
    document_content: Optional[str] = None
    history: List[Dict[str, str]] = []
    context: Optional[Dict[str, Any]] = None

class ValidationResult(BaseModel):
    is_valid: bool
    issues: List[Dict[str, Any]]
    suggestions: List[str]
    compliance_score: float
    timestamp: str

# Mock LLM processing (in production, this would use actual AI models)
def process_document_validation(content: str, security_level: str = "일반") -> ValidationResult:
    """
    Mock document validation logic
    In production, this would integrate with actual AI models
    """
    issues = []
    suggestions = []
    
    # Basic validation rules
    if len(content.strip()) < 10:
        issues.append({
            "type": "length",
            "severity": "error",
            "message": "문서 내용이 너무 짧습니다.",
            "position": {"start": 0, "end": len(content)}
        })
    
    if "기밀" in content and security_level == "일반":
        issues.append({
            "type": "security",
            "severity": "warning", 
            "message": "기밀 정보가 포함된 것 같습니다. 보안 등급을 확인해주세요.",
            "position": {"start": content.find("기밀"), "end": content.find("기밀") + 2}
        })
    
    # Check for common formatting issues
    if content.count('\n\n') > content.count('\n') * 0.3:
        suggestions.append("문단 간격을 조정하여 가독성을 개선할 수 있습니다.")
    
    if not any(char in content for char in '.!?'):
        issues.append({
            "type": "punctuation",
            "severity": "suggestion",
            "message": "문장 부호가 부족합니다.",
            "position": {"start": 0, "end": len(content)}
        })
    
    # Calculate compliance score
    total_checks = 4
    passed_checks = total_checks - len([issue for issue in issues if issue["severity"] in ["error", "warning"]])
    compliance_score = (passed_checks / total_checks) * 100
    
    return ValidationResult(
        is_valid=len([issue for issue in issues if issue["severity"] == "error"]) == 0,
        issues=issues,
        suggestions=suggestions,
        compliance_score=compliance_score,
        timestamp=datetime.now().isoformat()
    )

def process_chat_message(message: str, document_content: str = None, history: List[Dict] = None) -> str:
    """
    Mock chat processing logic
    In production, this would integrate with actual AI models
    """
    if document_content:
        if "요약" in message or "summary" in message.lower():
            return f"문서 요약: {document_content[:100]}..." if len(document_content) > 100 else f"문서 요약: {document_content}"
        elif "개선" in message or "improve" in message.lower():
            return "문서 개선 제안: 1) 문단 구조 정리, 2) 전문 용어 설명 추가, 3) 결론 부분 강화"
        elif "검토" in message or "review" in message.lower():
            return "문서 검토 결과: 전반적으로 양호하나, 일부 문법 오류와 표현 개선이 필요합니다."
    
    # General responses
    if "안녕" in message or "hello" in message.lower():
        return "안녕하세요! 문서 작성과 검토를 도와드리겠습니다. 어떤 도움이 필요하신가요?"
    elif "도움" in message or "help" in message.lower():
        return "다음과 같은 기능을 제공합니다:\n- 문서 검증 및 오류 검출\n- 문서 요약 및 개선 제안\n- 보안 등급 확인\n- 문법 및 맞춤법 검사"
    else:
        return f"'{message}'에 대해 답변드리겠습니다. 더 구체적인 질문을 해주시면 더 정확한 도움을 드릴 수 있습니다."

# REST API endpoints
@app.get("/")
async def root():
    return {"message": "Docenty AI Worker is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/analyze", response_model=ValidationResult)
async def analyze_document(request: DocumentAnalysisRequest):
    """Analyze document content for validation and compliance"""
    try:
        logger.info(f"Analyzing document with security level: {request.security_level}")
        result = process_document_validation(request.content, request.security_level)
        return result
    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest):
    """Process chat messages with optional document context"""
    try:
        logger.info(f"Processing chat message: {request.message[:50]}...")
        reply = process_chat_message(
            request.message, 
            request.document_content, 
            request.history
        )
        return {"reply": reply, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_info: Dict[WebSocket, Dict] = {}

    async def connect(self, websocket: WebSocket, client_info: Dict = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = client_info or {}
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            self.connection_info.pop(websocket, None)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {str(e)}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                request = json.loads(data)
                request_type = request.get("type")
                
                if request_type == "analyze":
                    content = request.get("content", "")
                    security_level = request.get("security_level", "일반")
                    
                    result = process_document_validation(content, security_level)
                    response = {
                        "type": "analysis",
                        "result": result.dict(),
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_message(json.dumps(response), websocket)
                    
                elif request_type == "chat":
                    message = request.get("message", "")
                    document_content = request.get("document_content")
                    history = request.get("history", [])
                    
                    reply = process_chat_message(message, document_content, history)
                    response = {
                        "type": "chat",
                        "result": reply,
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_message(json.dumps(response), websocket)
                    
                elif request_type == "ping":
                    response = {
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_message(json.dumps(response), websocket)
                    
                else:
                    error_response = {
                        "type": "error",
                        "message": f"Unknown request type: {request_type}",
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_message(json.dumps(error_response), websocket)
                    
            except json.JSONDecodeError as e:
                error_response = {
                    "type": "error",
                    "message": f"Invalid JSON: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_message(json.dumps(error_response), websocket)
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {str(e)}")
                error_response = {
                    "type": "error",
                    "message": f"Processing error: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_message(json.dumps(error_response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 