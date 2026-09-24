export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace équipe",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full bg-paper text-ink">{children}</div>;
}
