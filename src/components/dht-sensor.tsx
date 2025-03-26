"use client";

import React, { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Thermometer, Droplet, Cloud, Sun, Wind } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

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
      if (action === 'stop') {
        setSensorData(null);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    }
  }, [isMonitoring]);

  const connectionStatus = ReadyState[readyState];
  
  // Temperature color
  const getTempColor = (temp: number) => {
    if (temp < 60) return "green";
    if (temp > 85) return "red";
    return "yellow";
  };
  
  // Humidity color
  const getHumidityColor = (humidity: number) => {
    if (humidity < 30) return "yellow";
    if (humidity > 70) return "red";
    return "green";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-red-500" />
          Temperature & Humidity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Status: {connectionStatus}
          </span>
          {isMonitoring && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Data Display */}
        <div 
          className={`relative bg-gray-50 rounded-md p-5 overflow-hidden ${!sensorData || isMonitoring ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""}`}
        >
          {sensorData ? (
            <div className="space-y-5">
              {/* Temperature Card */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Temperature</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-semibold">{sensorData.temperature_f.toFixed(1)}</span>
                    <span className="text-gray-500">°F</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-2xl font-semibold">{sensorData.temperature_c.toFixed(1)}</span>
                    <span className="text-gray-500">°C</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress value={Math.min(100, Math.max(0, (sensorData.temperature_c / 55) * 100))}
                    color={getTempColor(sensorData.temperature_f)} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>{32}</span>
                      <span>°F</span>
                      <span> / </span>
                      <span>{0}</span>
                      <span>°C</span>
                    </div>
                    <span>{sensorData.temperature_f < 60 ? "Cold" : sensorData.temperature_f > 85 ? "Hot" : "Comfortable"}</span>
                    <div className="flex items-center gap-1">
                      <span>{131}</span>
                      <span>°F</span>
                      <span> / </span>
                      <span>{55}</span>
                      <span>°C</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Humidity Card */}
              <div className="space-y-2" style={{ marginTop: "1rem" }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Humidity</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-semibold">{sensorData.humidity}</span>
                    <span className="text-gray-500 mb-0.5">%</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress value={sensorData.humidity} color={getHumidityColor(sensorData.humidity)} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>{sensorData.humidity < 30 ? "Dry" : sensorData.humidity > 70 ? "Humid" : "Normal"}</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              {/* Climate Status */}
              <div className="flex items-center justify-center p-4 rounded-lg shadow-sm border border-gray-200" style={{ marginTop: "1rem"} }>
                {sensorData.temperature_f > 85 && sensorData.humidity > 70 ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-full" style={{ backgroundColor: "rgb(255, 237, 213)" }}>
                      <Wind className="h-6 w-6" style={{ color: "rgb(249, 115, 22)" }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "rgb(234, 88, 12)" }}>Hot and humid conditions</p>
                      <p className="text-xs mt-1" style={{ color: "rgb(107, 114, 128)" }}>Consider using air conditioning</p>
                    </div>
                  </div>
                ) : sensorData.temperature_f < 60 && sensorData.humidity > 70 ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-full" style={{ backgroundColor: "rgb(219, 234, 254)" }}>
                      <Cloud className="h-6 w-6" style={{ color: "rgb(59, 130, 246)" }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "rgb(37, 99, 235)" }}>Cool and damp conditions</p>
                      <p className="text-xs mt-1" style={{ color: "rgb(107, 114, 128)" }}>Consider using a dehumidifier</p>
                    </div>
                  </div>
                ) : sensorData.temperature_f > 75 && sensorData.humidity < 30 ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-full" style={{ backgroundColor: "rgb(254, 249, 195)" }}>
                      <Sun className="h-6 w-6" style={{ color: "rgb(234, 179, 8)" }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "rgb(202, 138, 4)" }}>Warm and Dry conditions</p>
                      <p className="text-xs mt-1" style={{ color: "rgb(107, 114, 128)" }}>Consider using a humidifier</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse" 
                        style={{ 
                          backgroundColor: "#10b981",
                          filter: "blur(12px)",
                          opacity: 0.3,
                          borderRadius: "50%"
                        }} 
                      />
                      <Cloud className="h-6 w-6 relative" style={{ color: "#10b981" }} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p 
                        className="font-medium animate-pulse"
                        style={{ 
                          color: "#10b981",
                          textShadow: "0 0 10px rgba(16, 185, 129, 0.5)"
                        }}
                      >
                        Comfortable conditions
                      </p>
                      <p className="text-xs mt-1" style={{ color: "rgb(107, 114, 128)" }}>
                        Ideal indoor climate
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stop monitoring hint */}
              {isMonitoring && (
                <div onClick={sensorData ? (isMonitoring ? toggleMonitoring : undefined) : toggleMonitoring} className="relative border border-gray-200 rounded-md flex items-center justify-center gap-2 text-sm text-gray-500" style={{ marginTop: "1rem", padding:"1rem", backgroundColor: "#fb2c3626", cursor: "pointer" }}>
                  Stop monitoring
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-gray-100 rounded-md" style={{ padding: "1rem", cursor: "pointer", "backgroundColor": isMonitoring ? "inherit":"#10b98133"}}>
              {readyState === ReadyState.OPEN ? (
                isMonitoring ? (
                  <>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 2
                      }}
                    >
                      <Cloud className="h-14 w-14 text-blue-300" />
                    </motion.div>
                    <span className="text-gray-500 text-sm">Awaiting sensor data...</span>
                  </>
                ) : (
                  <div 
                    className="flex flex-col items-center gap-2 text-center"
                    onClick={sensorData ? (isMonitoring ? toggleMonitoring : undefined) : toggleMonitoring}
                  >
                    <Sun className="h-14 w-14" color="#F2C94C" />
                    <span 
                      className="text-gray-500 text-sm font-medium"
                    >
                      Start monitoring
                    </span>
                  </div>
                )
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
                  <span className="text-gray-500 text-sm">{connectionStatus}...</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 