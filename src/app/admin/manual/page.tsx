import { RoutePlaceholder } from "@/components/route-placeholder";

/** Manual estático de operação (conteúdo definido em plano.md). */
export default function AdminManualPage() {
  return (
    <RoutePlaceholder
      title="Manual de Operação do Campeonato"
      route="/admin/manual"
      description="Passo a passo de cadastro e configuração do PC espectador (GSI)."
    />
  );
}
