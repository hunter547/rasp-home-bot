from fastapi import FastAPI, WebSocket
from contextlib import asynccontextmanager
from .classes.jpeg_stream import JpegStream
from .classes.dht_sensor import DHTSensor
import asyncio
import platform
import psutil

jpeg_stream = JpegStream()
dht_sensor = DHTSensor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    print("done")
    await jpeg_stream.stop()
    await dht_sensor.stop()


### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json", lifespan=lifespan)

# HTTP Endpoints

@app.post("/api/py/camera/start")
async def start_stream():
    await jpeg_stream.start()
    return {"message": "Stream started"}


@app.post("/api/py/camera/stop")
async def stop_stream():
    await jpeg_stream.stop()
    return {"message": "Stream stopped"}

@app.post("/api/py/sensor/dht/start")
async def start_dht_sensor():
    await dht_sensor.start()
    return {"message": "DHT sensor started"}


@app.post("/api/py/sensor/dht/stop")
async def stop_dht_sensor():
    await dht_sensor.stop()
    return {"message": "DHT sensor stopped"}

@app.get("/api/py/sensor/dht")
def get_current_data():
    return dht_sensor.get_current_reading()

# WebSocket Endpoints

@app.websocket("/api/py/camera/ws")
async def camera_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    jpeg_stream.connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        jpeg_stream.connections.remove(websocket)
        if not jpeg_stream.connections:
            await jpeg_stream.stop()

@app.websocket("/api/py/sensor/dht/ws")
async def dht_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    dht_sensor.connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        dht_sensor.connections.remove(websocket)
        if not dht_sensor.connections:
            await dht_sensor.stop()

@app.websocket("/api/py/system/ws")
async def system_stats_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Get CPU temperature
            try:
                with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                    cpu_temp = float(f.read().strip()) / 1000.0
            except:
                cpu_temp = 0.0
                
            # Get CPU usage
            cpu_usage = [str(x) for x in psutil.cpu_percent(percpu=True)]
            
            # Get memory usage
            memory = psutil.virtual_memory()
            memory_used = memory.used / (1024 ** 3)  # Convert to GB
            memory_total = memory.total / (1024 ** 3)  # Convert to GB
            
            system_info = {
                "os": {
                    "hostname": platform.node(),
                    "platform": platform.system(),
                    "arch": platform.machine(),
                },
                "cpuTemp": cpu_temp,
                "cpuUsage": cpu_usage,
                "memoryUsage": {
                    "used": memory_used,
                    "total": memory_total,
                }
            }
            
            await websocket.send_json(system_info)
            await asyncio.sleep(0.1)  # Send update every 0.1 seconds
            
    except Exception as e:
        print(f"System stats websocket error: {e}")
    finally:
        print("System stats websocket closed")
