"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type SystemInfo = {
  os: {
    hostname: string;
    platform: string;
    arch: string;
  };
  cpuTemp: number;
  cpuUsage: string[];
  memoryUsage: {
    used: number;
    total: number;
  };
};

function getCpuUsageColor(usage: number): "green" | "yellow" | "red" {
  if (usage < 50) return "green";
  if (usage < 80) return "yellow";
  return "red";
}

export default function SystemStats() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { lastMessage, readyState } = useWebSocket("/api/py/system/ws", {
    shouldReconnect: () => true,
    reconnectInterval: 1000,
  });

  useEffect(() => {
    if (lastMessage?.data) {
      try {
        const data = JSON.parse(lastMessage.data);
        setSystemInfo(data);
      } catch (err) {
        console.error("Failed to parse system data:", err);
        setError("Failed to parse system data");
      }
    }
  }, [lastMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Disconnected",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  if (readyState !== ReadyState.OPEN) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Status: {connectionStatus}...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!systemInfo) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {[
            ["Hostname", systemInfo.os.hostname],
            ["Platform", systemInfo.os.platform],
            ["Architecture", systemInfo.os.arch],
            ["CPU Temperature", `${systemInfo.cpuTemp.toFixed(1)}°C`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}:</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">CPU Usage</h3>
          {systemInfo.cpuUsage.map((usage, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Core {index}</span>
                <span>{usage}%</span>
              </div>
              <Progress 
                value={parseFloat(usage)} 
                className="h-2" 
                color={getCpuUsageColor(parseFloat(usage))}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Memory Usage</h3>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Used</span>
            <span>{systemInfo.memoryUsage.used.toFixed(2)} / {systemInfo.memoryUsage.total.toFixed(2)} GB</span>
          </div>
          <Progress 
            value={(systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
}