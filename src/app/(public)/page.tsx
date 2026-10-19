import { RoutePlaceholder } from "@/components/route-placeholder";

export default function HomePage() {
  return (
    <RoutePlaceholder
      title="Campeonatos ativos"
      route="/"
      description="Listagem pública dos campeonatos em andamento (acesso via link/QR Code)."
    />
  );
}
