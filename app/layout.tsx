import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // Optional: If you use a font
import "./globals.css"; // <--- THIS WAS MISSING
import JsonLd from "./components/jsonLD";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://react-brai.vercel.app"), // REPLACE with your domain
  title: {
    default: "React Brai | Edge AI Runtime for the Web",
    template: "%s | React Brai",
  },
  description: "The zero-latency WebGPU runtime for React. Run Llama-3, Phi-3, and Gemma directly in the browser with privacy-first local inference.",
  keywords: [
    "WebGPU", "Local LLM", "React Hook", "AI Runtime",
    "Llama 3", "Browser AI", "Edge Computing", "Privacy Preserving AI",
    "react-brai", "useLocalAI", "Edge AI"
  ],
  authors: [{ name: "Rauhl panchal" }],
  creator: "Rahul Panchal",
  publisher: "Rahul Panchal",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://react-brai.vercel.app",
    title: "React Brai - Edge AI Interface",
    description: "Run privacy-first AI without the infrastructure overhead.",
    siteName: "React Brai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "React Brai Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "React Brai | WebGPU AI Runtime",
    description: "Run Llama-3 and Mistral locally in your React apps.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.svg", // <--- Points to public/logo.svg
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">

      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* Inject Structured Data for SEO */}
        <JsonLd />

        {children}
        <Analytics />
      </body>
    </html>
  );
}