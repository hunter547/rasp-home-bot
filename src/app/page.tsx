import CameraStream from "@/components/camera";
import SystemStats from "@/components/system-stats";

export default async function Home() {
  <style>{`
    .container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .container {
        flex-direction: row;
      }
    }
  `}</style>
  return (
    <main className="p-6">
       <h1 className="text-3xl font-bold mb-6 text-foreground">Evanoff Home Raspberry Pi</h1>
       <div className="flex flex-col">
        <SystemStats />
        <div className="h-10"></div>
        <CameraStream />
       </div>
    </main>
  );
}