"use client";

import { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SensorData = {
  temperature_c: number;
  temperature_f: number;
  humidity: number;
};

export default function DHTSensor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);

  const { lastMessage, readyState } = useWebSocket("/api/py/sensor/dht/ws", {
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (lastMessage?.data) {
      try {
        const data = JSON.parse(lastMessage.data);
        setSensorData(data);
      } catch (e) {
        console.error("Failed to parse sensor data:", e);
      }
    }
  }, [lastMessage]);

  const toggleMonitoring = useCallback(async () => {
    const action = isMonitoring ? "stop" : "start";
    try {
      await fetch(`/api/py/sensor/dht/${action}`, { method: "POST" });
      setIsMonitoring(!isMonitoring);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    }
  }, [isMonitoring]);

  const connectionStatus = ReadyState[readyState];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Temperature & Humidity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Status: {connectionStatus}
          </span>
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? "Stop" : "Start"} Monitoring
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 p-4 rounded-md">
          {sensorData ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Temperature:</span>
                <span>{sensorData.temperature_f.toFixed(1)}°F / {sensorData.temperature_c.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Humidity:</span>
                <span>{sensorData.humidity}%</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {readyState === ReadyState.OPEN 
                ? (isMonitoring ? "Waiting for sensor data..." : "Click 'Start Monitoring' to begin")
                : `${connectionStatus}...`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 