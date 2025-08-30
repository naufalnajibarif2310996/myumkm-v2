"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for the token cookie on the client side
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));
    setIsAuthenticated(!!token);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-background dark:to-blue-950/20">
      <div className="container px-6 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-16 pb-12 md:pb-16 lg:pb-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center max-w-7xl mx-auto">
          <div className="space-y-3 lg:pr-4">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                🚀 Platform UMKM Terdepan di Indonesia
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="text-primary">My UMKM</span>
                <br />
                <span className="text-muted-foreground">Solusi Lengkap</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Bisnis Anda
                </span>
              </h1>
              <p className="text-sm text-muted-foreground md:text-base max-w-2xl">
                Platform terbaik untuk para pelaku UMKM. Dari pengelolaan inventaris, edukasi bisnis, hingga artikel
                inspiratif - semua yang Anda butuhkan untuk mengembangkan usaha ada di sini.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base" asChild>
                <Link href={isAuthenticated ? "/dashboard" : "/auth/register"}>
                  {isAuthenticated ? "Masuk ke Dashboard" : "Daftar My UMKM"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                <Play className="mr-2 h-5 w-5" />
                Lihat Demo
              </Button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>10,000+ UMKM Terdaftar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Gratis Selamanya</span>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-16">
            <div className="relative z-10">
              <Image
                src="/images/hero-illustration-final.jpeg"
                alt="My UMKM - Platform Manajemen Bisnis UMKM"
                width={1920}
                height={1080}
                className="rounded-xl"
                priority
              />
            </div>
            <div className="absolute -top-4 -right-4 h-72 w-72 rounded-full bg-blue-200/50 dark:bg-blue-800/20 blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-purple-200/50 dark:bg-purple-800/20 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
