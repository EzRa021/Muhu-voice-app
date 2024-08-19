import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./provider"; // Import the new Providers component
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
// import ProtectedRoute from "@/components/protectedRoute";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            {/* <ProtectedRoute> */}
            {children}
            <Toaster />
            {/* </ProtectedRoute> */}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
