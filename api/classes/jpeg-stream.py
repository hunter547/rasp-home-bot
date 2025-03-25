import asyncio
from picamera2 import Picamera2
from picamera2.encoders import MJPEGEncoder, Quality
from picamera2.outputs import FileOutput
from classes.streaming_output import StreamingOutput

class JpegStream:
    def __init__(self):
        self.active = False
        self.connections = set()
        self.picam2 = None
        self.task = None

    async def stream_jpeg(self):d
        self.picam2 = Picamera2()
        video_config = self.picam2.create_video_configuration(
            main={"size": (1920, 1080)}
        )
        self.picam2.configure(video_config)
        output = StreamingOutput()
        self.picam2.start_recording(MJPEGEncoder(), FileOutput(output), Quality.MEDIUM)

        try:
            while self.active:
                jpeg_data = await output.read()
                tasks = [
                    websocket.send_bytes(jpeg_data)
                    for websocket in self.connections.copy()
                ]
                await asyncio.gather(*tasks, return_exceptions=True)
        finally:
            self.picam2.stop_recording()
            self.picam2.close()
            self.picam2 = None

    async def start(self):
        if not self.active:
            self.active = True
            self.task = asyncio.create_task(self.stream_jpeg())

    async def stop(self):
        if self.active:
            self.active = False
            if self.task:
                await self.task
                self.task = None