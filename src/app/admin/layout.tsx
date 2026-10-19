export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
