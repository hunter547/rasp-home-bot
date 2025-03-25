import CameraStream from "@/components/camera";
import SystemStats from "@/components/system-stats";
import DHTSensor from "@/components/dht-sensor";

export default async function Home() {
  return (
    <main className="p-6">
       <h1 className="text-3xl font-bold mb-6 text-foreground">Evanoff Home Raspberry Pi</h1>
       <div className="flex flex-col md:flex-row flex-wrap gap-6">
        <SystemStats />
        <div className="h-10"></div>
        <DHTSensor />
        <div className="h-10"></div>
        <CameraStream />
       </div>
    </main>
  );
}