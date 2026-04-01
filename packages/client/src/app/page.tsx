import { APP_NAME } from "@os-drafter/shared";
import { RoomCreationForm } from "@/components/room/room-creation-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft tool for competitive play
        </p>
      </div>
      <RoomCreationForm />
    </main>
  );
}
