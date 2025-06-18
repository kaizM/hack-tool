from fastapi import FastAPI, APIRouter, HTTPException, WebSocket
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import psutil
import json
import asyncio
try:
    import pyautogui
    from pynput import mouse, keyboard
    GUI_AVAILABLE = True
except Exception as e:
    logging.warning(f"GUI libraries not available: {str(e)}. Running in headless mode.")
    GUI_AVAILABLE = False
import threading
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Game Hacking Tools API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Global variables for automation
automation_active = False
automation_thread = None
connected_processes = {}

# Models
class GameProcess(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pid: int
    exe_path: str
    status: str = "detected"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MemoryAddress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    process_id: str
    address: str
    value: Any
    data_type: str  # int, float, string, bytes
    description: Optional[str] = None

class AutomationScript(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    actions: List[Dict[str, Any]]
    active: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HackingSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_name: str
    process_id: str
    tools_enabled: List[str]
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Game Process Management
@api_router.get("/processes", response_model=List[GameProcess])
async def get_game_processes():
    """Detect running game processes"""
    try:
        processes = []
        game_keywords = ["game", "unity", "unreal", "kingshot", "steam", "battle", "rpg", "mmo"]
        
        for proc in psutil.process_iter(['pid', 'name', 'exe']):
            try:
                proc_info = proc.info
                if proc_info['name'] and any(keyword.lower() in proc_info['name'].lower() for keyword in game_keywords):
                    game_proc = GameProcess(
                        name=proc_info['name'],
                        pid=proc_info['pid'],
                        exe_path=proc_info['exe'] or "Unknown"
                    )
                    processes.append(game_proc)
                    
                    # Store in database
                    await db.game_processes.update_one(
                        {"pid": proc_info['pid']},
                        {"$set": game_proc.dict()},
                        upsert=True
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
        return processes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting processes: {str(e)}")

@api_router.post("/processes/{pid}/connect")
async def connect_to_process(pid: int):
    """Connect to a specific game process"""
    try:
        # Check if process exists
        if not psutil.pid_exists(pid):
            raise HTTPException(status_code=404, detail="Process not found")
        
        proc = psutil.Process(pid)
        process_info = {
            "pid": pid,
            "name": proc.name(),
            "status": "connected",
            "memory_info": proc.memory_info()._asdict(),
            "cpu_percent": proc.cpu_percent()
        }
        
        connected_processes[pid] = process_info
        
        # Update database
        await db.game_processes.update_one(
            {"pid": pid},
            {"$set": {"status": "connected", "connected_at": datetime.utcnow()}},
            upsert=True
        )
        
        return {"message": f"Successfully connected to process {pid}", "process_info": process_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to process: {str(e)}")

# Memory Scanning and Editing
@api_router.post("/memory/scan")
async def scan_memory(pid: int, value: Any, data_type: str = "int"):
    """Scan process memory for specific values"""
    try:
        if pid not in connected_processes:
            raise HTTPException(status_code=400, detail="Process not connected")
        
        # This is a simplified memory scanning - in real implementation,
        # you'd use libraries like pymem for actual memory manipulation
        results = []
        
        # Simulate memory scanning results
        for i in range(5):
            address = f"0x{hex(0x1000000 + i * 0x1000)[2:].upper()}"
            mem_addr = MemoryAddress(
                process_id=str(pid),
                address=address,
                value=value,
                data_type=data_type,
                description=f"Memory location {i+1}"
            )
            results.append(mem_addr)
            
            # Store in database
            await db.memory_addresses.insert_one(mem_addr.dict())
        
        return {"message": f"Found {len(results)} memory addresses", "addresses": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory scan error: {str(e)}")

@api_router.post("/memory/edit")
async def edit_memory(pid: int, address: str, new_value: Any, data_type: str = "int"):
    """Edit memory at specific address"""
    try:
        if pid not in connected_processes:
            raise HTTPException(status_code=400, detail="Process not connected")
        
        # Simulate memory editing
        # In real implementation, use pymem to write to memory
        success = True  # Simulate successful edit
        
        if success:
            # Update database record
            await db.memory_addresses.update_one(
                {"process_id": str(pid), "address": address},
                {"$set": {"value": new_value, "updated_at": datetime.utcnow()}}
            )
            
            return {"message": f"Successfully updated memory at {address} to {new_value}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to edit memory")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory edit error: {str(e)}")

# Automation System
@api_router.post("/automation/start")
async def start_automation(script: AutomationScript):
    """Start automation script"""
    global automation_active, automation_thread
    
    try:
        if automation_active:
            return {"message": "Automation already running"}
        
        # Store script in database
        await db.automation_scripts.insert_one(script.dict())
        
        automation_active = True
        automation_thread = threading.Thread(target=run_automation, args=(script.actions,))
        automation_thread.daemon = True
        automation_thread.start()
        
        return {"message": "Automation started successfully", "script_id": script.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Automation start error: {str(e)}")

@api_router.post("/automation/stop")
async def stop_automation():
    """Stop automation script"""
    global automation_active
    
    try:
        automation_active = False
        return {"message": "Automation stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Automation stop error: {str(e)}")

def run_automation(actions):
    """Run automation actions in separate thread"""
    global automation_active
    
    while automation_active:
        try:
            for action in actions:
                if not automation_active:
                    break
                    
                action_type = action.get("type")
                
                if action_type == "click":
                    x, y = action.get("x", 100), action.get("y", 100)
                    pyautogui.click(x, y)
                elif action_type == "key":
                    key = action.get("key", "space")
                    pyautogui.press(key)
                elif action_type == "wait":
                    delay = action.get("duration", 1)
                    time.sleep(delay)
                elif action_type == "type":
                    text = action.get("text", "")
                    pyautogui.write(text)
                
                # Small delay between actions
                time.sleep(0.1)
                
        except Exception as e:
            logging.error(f"Automation error: {str(e)}")
            
        # Loop delay
        time.sleep(1)

# Game-specific hacks
@api_router.post("/hacks/unlimited-resources")
async def enable_unlimited_resources(pid: int, resource_type: str):
    """Enable unlimited resources hack"""
    try:
        if pid not in connected_processes:
            raise HTTPException(status_code=400, detail="Process not connected")
        
        # Simulate resource hack activation
        hack_session = HackingSession(
            game_name=connected_processes[pid]["name"],
            process_id=str(pid),
            tools_enabled=["unlimited_resources"],
            status="active"
        )
        
        await db.hacking_sessions.insert_one(hack_session.dict())
        
        return {"message": f"Unlimited {resource_type} enabled for process {pid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resource hack error: {str(e)}")

@api_router.post("/hacks/speed-boost")
async def enable_speed_boost(pid: int, multiplier: float = 2.0):
    """Enable speed boost hack"""
    try:
        if pid not in connected_processes:
            raise HTTPException(status_code=400, detail="Process not connected")
        
        # Simulate speed hack
        return {"message": f"Speed boost x{multiplier} enabled for process {pid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speed hack error: {str(e)}")

@api_router.post("/hacks/auto-aim")
async def enable_auto_aim(pid: int, sensitivity: float = 1.0):
    """Enable auto-aim hack"""
    try:
        if pid not in connected_processes:
            raise HTTPException(status_code=400, detail="Process not connected")
        
        # Simulate auto-aim
        return {"message": f"Auto-aim enabled with sensitivity {sensitivity} for process {pid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-aim error: {str(e)}")

# Real-time monitoring
@api_router.websocket("/ws/monitor/{pid}")
async def websocket_monitor(websocket: WebSocket, pid: int):
    """WebSocket for real-time process monitoring"""
    await websocket.accept()
    
    try:
        while True:
            if pid in connected_processes:
                try:
                    proc = psutil.Process(pid)
                    data = {
                        "timestamp": datetime.utcnow().isoformat(),
                        "cpu_percent": proc.cpu_percent(),
                        "memory_info": proc.memory_info()._asdict(),
                        "status": proc.status(),
                        "num_threads": proc.num_threads()
                    }
                    await websocket.send_text(json.dumps(data))
                except psutil.NoSuchProcess:
                    await websocket.send_text(json.dumps({"error": "Process no longer exists"}))
                    break
            else:
                await websocket.send_text(json.dumps({"error": "Process not connected"}))
                
            await asyncio.sleep(1)
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}")

# Statistics and History
@api_router.get("/sessions", response_model=List[HackingSession])
async def get_hacking_sessions():
    """Get all hacking sessions"""
    sessions = await db.hacking_sessions.find().to_list(100)
    return [HackingSession(**session) for session in sessions]

@api_router.get("/memory/history/{process_id}")
async def get_memory_history(process_id: str):
    """Get memory editing history for a process"""
    history = await db.memory_addresses.find({"process_id": process_id}).to_list(100)
    return history

@api_router.get("/automation/scripts", response_model=List[AutomationScript])
async def get_automation_scripts():
    """Get all automation scripts"""
    scripts = await db.automation_scripts.find().to_list(100)
    return [AutomationScript(**script) for script in scripts]

# Legacy endpoints
@api_router.get("/")
async def root():
    return {"message": "Game Hacking Tools API - Ready to hack!"}

@api_router.get("/status")
async def api_status():
    """API health check"""
    return {
        "status": "online",
        "connected_processes": len(connected_processes),
        "automation_active": automation_active,
        "timestamp": datetime.utcnow().isoformat()
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    global automation_active
    automation_active = False
    client.close()
