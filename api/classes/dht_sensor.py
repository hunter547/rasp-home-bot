import asyncio
import board
import adafruit_dht
from fastapi import WebSocket

class DHTSensor:
    def __init__(self, pin=board.D4):
        # Initialize the DHT device
        self.dht_device = adafruit_dht.DHT11(pin, use_pulseio=False)
        self.connections = set()
        self.active = False
        self.task = None

    async def read_sensor(self):
        while self.active:
            try:
                # Read values from the sensor
                temperature_c = self.dht_device.temperature
                temperature_f = temperature_c * (9 / 5) + 32
                humidity = self.dht_device.humidity
                
                # Create data payload
                data = {
                    "temperature_c": temperature_c,
                    "temperature_f": temperature_f,
                    "humidity": humidity
                }
                
                # Send to all connected websockets
                if self.connections:
                    tasks = [
                        websocket.send_json(data)
                        for websocket in self.connections.copy()
                    ]
                    await asyncio.gather(*tasks, return_exceptions=True)
                
                # Print for debugging
                print(
                    "Temp: {:.1f} F / {:.1f} C    Humidity: {}% ".format(
                        temperature_f, temperature_c, humidity
                    )
                )
                
            except RuntimeError as error:
                # Errors happen fairly often, DHT's are hard to read, just keep going
                print(error.args[0])
            except Exception as error:
                print(f"Unexpected error: {error}")
            
            # Wait before next reading
            await asyncio.sleep(0.1)
    
    async def start(self):
        if not self.active:
            self.active = True
            self.task = asyncio.create_task(self.read_sensor())
    
    async def stop(self):
        if self.active:
            self.active = False
            if self.task:
                await self.task
                self.task = None
    
    def get_current_reading(self):
        """Get a single reading (non-async method for direct calls)"""
        try:
            temperature_c = self.dht_device.temperature
            temperature_f = temperature_c * (9 / 5) + 32
            humidity = self.dht_device.humidity
            return {
                "temperature_c": temperature_c,
                "temperature_f": temperature_f,
                "humidity": humidity
            }
        except Exception as e:
            return {"error": str(e)}

# Example usage in FastAPI:
'''
from fastapi import FastAPI, WebSocket

app = FastAPI()
dht_sensor = DHTSensor()

@app.on_event("startup")
async def startup_event():
    await dht_sensor.start()

@app.on_event("shutdown")
async def shutdown_event():
    await dht_sensor.stop()

@app.websocket("/api/sensor/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    dht_sensor.connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        dht_sensor.connections.remove(websocket)

@app.get("/api/sensor/current")
def get_current_data():
    return dht_sensor.get_current_reading()
'''
