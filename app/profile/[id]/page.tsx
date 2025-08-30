"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, ArrowLeft, Plus, Package } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

interface BusinessProfile {
  id: string;
  businessName: string;
  description: string | null;
  category: string;
  location: string | null;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  marketplacelisting?: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    createdAt: string;
  }>;
}

export default function ProfileDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get current user first
        const userRes = await fetch('/api/auth/me');
        let currentUserId = null;
        
        if (userRes.ok) {
          const userData = await userRes.json();
          currentUserId = userData.id;
        }
        
        // Fetch the profile data
        const res = await fetch(`/api/profiles/${params.id}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Gagal memuat profil');
        }
        
        const profileData = await res.json();
        
        if (!profileData) {
          throw new Error('Data profil tidak ditemukan');
        }
        
        // Check if this is the current user's profile
        setIsCurrentUser(!!(currentUserId && profileData.userId === currentUserId));
        setProfile(profileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat profil. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    } else {
      setError('ID Profil tidak valid');
      setIsLoading(false);
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex" style={{ height: "calc(100vh - 4rem)" }}>
          <DashboardSidebar />
          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-12 w-48" />
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex" style={{ height: "calc(100vh - 4rem)" }}>
          <DashboardSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error || 'Profil tidak ditemukan'}</p>
              <Button asChild>
                <Link href="/marketplace">Kembali ke Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex" style={{ height: "calc(100vh - 4rem)" }}>
        <DashboardSidebar />
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/marketplace">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">{profile.businessName}</h1>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{profile.businessName}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Building className="h-4 w-4 mr-1" />
                      {profile.category}
                    </CardDescription>
                    {profile.location && (
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-lg">Tentang Bisnis</h3>
                    <div className="prose max-w-none text-muted-foreground">
                      {profile.description ? (
                        <p className="whitespace-pre-line">{profile.description}</p>
                      ) : (
                        <p className="text-muted-foreground/70 italic">Tidak ada deskripsi bisnis</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Produk & Jasa</h3>
                      {isCurrentUser && (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/dashboard/products/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Produk
                          </Link>
                        </Button>
                      )}
                    </div>

                    {profile.marketplacelisting && profile.marketplacelisting.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {profile.marketplacelisting.map((item) => (
                          <Card key={item.id} className="group hover:shadow-md transition-shadow h-full flex flex-col">
                            <CardContent className="p-4 flex-1 flex flex-col">
                              <div className="flex-1">
                                <h4 className="font-medium text-lg">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                  {item.description}
                                </p>
                              </div>
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="font-semibold text-primary text-lg">
                                  {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                  }).format(item.price)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">
                          {isCurrentUser 
                            ? 'Anda belum menambahkan produk. Mulai tambahkan produk pertama Anda.'
                            : 'Belum ada produk yang tersedia.'}
                        </p>
                        {isCurrentUser && (
                          <Button className="mt-4" asChild>
                            <Link href="/dashboard/products/new">
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Produk Pertama
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
