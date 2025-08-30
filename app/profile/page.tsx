"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ProductForm } from "@/components/dashboard/product-form";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

interface BusinessProfile {
  id: string;
  businessName: string;
  description: string | null;
  category: string;
  location: string | null;
  marketplacelisting: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    createdAt: string;
  }>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching profile from /api/profile');
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        // window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include', // Include cookies
        cache: 'no-store' // Don't cache the request
      });
      
      console.log('Profile fetch response status:', response.status);
      
      // First check if we got a valid JSON response
      let data;
      try {
        data = await response.clone().json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('Profile data received:', data);
      
      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.log('Unauthorized - redirecting to login');
          // window.location.href = '/login';
          return;
        }
        // Handle 404 - Profile not found
        if (response.status === 404) {
          console.log('Business profile not found - showing create profile form');
          // Instead of redirecting, we'll show the profile creation form
          setProfile(null);
          setIsProfileDialogOpen(true);
          return;
        }
        throw new Error(data.error || `Failed to fetch profile (${response.status})`);
      }

      // Ensure marketplacelisting is always an array
      const profileData = {
        ...data,
        marketplacelisting: Array.isArray(data.marketplacelisting) 
          ? data.marketplacelisting 
          : []
      };

      setProfile(profileData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('Profile fetch error:', errorMessage);
      setError(errorMessage);
      setProfile(null);
      
      // Show error message for unauthorized access
      if (errorMessage.includes('Unauthorized')) {
        setError('Anda perlu login untuk melihat profil bisnis');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileFormSubmit = () => {
    setIsProfileDialogOpen(false);
    fetchProfile();
  };

  const handleProductFormSubmit = () => {
    setIsProductDialogOpen(false);
    fetchProfile(); // Re-fetch profile to get updated listings
  };

  const renderProfileContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="w-full h-40" />
          <Skeleton className="w-full h-64" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error loading profile</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProfile} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    if (profile) {
      return (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{profile.businessName}</CardTitle>
              <CardDescription>{profile.category}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Deskripsi</h4>
                <p className="text-muted-foreground">{profile.description || "-"}</p>
              </div>
              <div>
                <h4 className="font-semibold">Lokasi</h4>
                <p className="text-muted-foreground">{profile.location || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Produk & Jasa Anda</CardTitle>
                <CardDescription>Kelola penawaran yang akan tampil di direktori.</CardDescription>
              </div>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Tambah Baru</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Produk/Jasa Baru</DialogTitle>
                  </DialogHeader>
                  <ProductForm businessProfileId={profile.id} onFormSubmit={handleProductFormSubmit} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {profile.marketplacelisting && profile.marketplacelisting.length > 0 ? (
                <div className="space-y-2">
                  {profile.marketplacelisting.map((item: any) => (
                    <div key={item.id} className="border p-2 rounded-md">{item.title}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Anda belum menambahkan produk atau jasa.</p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium">Anda belum memiliki Profil Bisnis</h3>
          <p className="text-sm text-muted-foreground mb-4">Buat profil untuk mulai berkolaborasi.</p>
          <Button 
            onClick={() => setIsProfileDialogOpen(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Memuat...' : 'Buat Profil Sekarang'}
          </Button>
        </div>
      );
    };

    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium">Anda belum memiliki Profil Bisnis</h3>
        <p className="text-sm text-muted-foreground mb-4">Buat profil untuk mulai berkolaborasi.</p>
        <Button onClick={() => setIsProfileDialogOpen(true)}>Buat Profil Sekarang</Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Profil Bisnis</h1>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{profile ? "Edit Profil" : "Buat Profil Bisnis"}</Button>
              </DialogTrigger>
              <DialogContent 
                description={profile ? "Form untuk mengedit profil bisnis Anda" : "Form untuk membuat profil bisnis baru"}
              >
                <DialogHeader>
                  <DialogTitle>{profile ? "Edit Profil Bisnis" : "Buat Profil Bisnis Baru"}</DialogTitle>
                </DialogHeader>
                <ProfileForm existingProfile={profile} onFormSubmit={handleProfileFormSubmit} />
              </DialogContent>
            </Dialog>
          </div>
          {renderProfileContent()}
        </main>
      </div>
    </div>
  );
}
