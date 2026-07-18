import type { Metadata } from "next";
import localFont from "next/font/local";
import { Manrope, Syne, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./MixpanelInitializer";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
const inter = localFont({
  src: [
    {
      path: "./fonts/Inter.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smartslides.ai"),
  title: "SmartSlides - Open Source AI presentation generator",
  description:
    "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
  keywords: [
    "AI presentation generator",
    "data storytelling",
    "data visualization tool",
    "AI data presentation",
    "presentation generator",
    "data to presentation",
    "interactive presentations",
    "professional slides",
  ],
  openGraph: {
    title: "SmartSlides - Open Source AI presentation generator",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    url: "https://smartslides.ai",
    siteName: "SmartSlides",
    images: [
      {
        url: "https://smartslides.ai/presenton-feature-graphics.png",
        width: 1200,
        height: 630,
        alt: "SmartSlides Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "https://smartslides.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartSlides - Open Source AI presentation generator",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    images: ["https://smartslides.ai/presenton-feature-graphics.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/Presenton_Splash.png" as="image" />
      </head>
      <body
        className={`${inter.variable} ${syne.variable} ${manrope.variable} ${unbounded.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{ theme: shadcn, variables: { colorPrimary: "#7C51F8" } }}
        >
          <Providers>
            <MixpanelInitializer>

              {children}

            </MixpanelInitializer>
          </Providers>
          <Toaster position="top-center" />
        </ClerkProvider>
      </body>
    </html>
  );
}
