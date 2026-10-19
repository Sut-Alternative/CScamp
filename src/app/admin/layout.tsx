export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Navegação do painel admin entra aqui na etapa de frontend.
  // A proteção por senha é feita em src/proxy.ts + checagem nas Server Actions.
  return <>{children}</>;
}
