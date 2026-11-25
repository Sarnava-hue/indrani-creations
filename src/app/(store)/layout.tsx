import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WishlistProvider } from "@/components/store/wishlist-provider";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WishlistProvider>
      <div className="flex min-h-screen flex-col bg-[#faf8f4] text-[#29251f]">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </WishlistProvider>
  );
}
