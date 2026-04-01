import { APP_NAME } from "@os-drafter/shared";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold text-primary">{APP_NAME}</h1>
      <p className="mt-4 text-muted-foreground">Draft tool for competitive play</p>
    </main>
  );
}
