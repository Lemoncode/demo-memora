import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1>Hola Mundo</h1>
          </CardTitle>
          <CardDescription>
            La cadena TanStack Start → Tailwind → shadcn funciona de punta a punta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Empezar</Button>
        </CardContent>
      </Card>
    </main>
  );
}
