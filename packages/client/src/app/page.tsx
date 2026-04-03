import { APP_NAME } from "@os-drafter/shared";
import { MapDraftForm } from "@/components/room/map-draft-form";
import { CharacterDraftForm } from "@/components/room/character-draft-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft tool for competitive play
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-6">
        <MapDraftForm />
        <CharacterDraftForm />
      </div>
    </main>
  );
}
