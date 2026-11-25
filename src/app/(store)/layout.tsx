import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f4] text-[#29251f]">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
