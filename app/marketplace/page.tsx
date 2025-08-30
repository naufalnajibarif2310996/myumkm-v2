"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, MessageCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import Link from "next/link";

interface BusinessProfile {
  id: string;
  businessName: string;
  description: string | null;
  category: string;
  location: string | null;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const categories = [
  "Makanan & Minuman",
  "Fashion",
  "Kerajinan Tangan",
  "Pertanian",
  "Jasa",
  "Lainnya",
];

export default function MarketplacePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<BusinessProfile[]>(
    []
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Auth hook
  const { user: authUser, token: authToken, loading: authLoading } = useAuth();

  // Load user + profiles
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (authUser) {
          setCurrentUser({
            id: authUser.id,
            name: authUser.name || "",
            email: authUser.email || "",
          });
        } else {
          setCurrentUser(null);
        }

        const headers: HeadersInit = {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

        const res = await fetch("/api/profiles", {
          headers,
          credentials: "include",
        });
        if (!res.ok) {
          console.warn("Gagal fetch profiles:", res.statusText);
          setProfiles([]);
        } else {
          const data = await res.json();
          setProfiles(data);
        }
      } catch (err) {
        console.error("Error fetch profiles:", err);
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) loadData();
  }, [authUser, authToken, authLoading]);

  // Filter profiles
  useEffect(() => {
    const filtered = profiles.filter((p) => {
      // kalau user login, exclude profile sendiri
      if (currentUser && p.user?.id === currentUser.id) return false;

      const matchesSearch =
        p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false);

      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, selectedCategory, currentUser]);

  // Cari profil user sendiri
  const usersOwnProfile = useMemo(() => {
    if (!currentUser) return undefined;
    return profiles.find(
      (p) => p.user?.id === currentUser.id || p.userId === currentUser.id
    );
  }, [currentUser, profiles]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? "" : category));
  };

  // Hubungi
  const handleContact = async (profile: BusinessProfile) => {
    if (!currentUser || !authToken) {
      toast.error("Harap login untuk mengirim pesan");
      return;
    }

    const targetUserId = profile.user?.id || profile.userId;
    if (!targetUserId) {
      toast.error("User ID tidak ditemukan");
      return;
    }

    // Check if it's the current user's own profile
    if (targetUserId === currentUser.id) {
      toast.error("Tidak dapat mengirim pesan ke diri sendiri");
      return;
    }

    const loadingToast = toast.loading("Membuka percakapan...");
    try {
      // 1. Panggil API untuk create/get conversation
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ 
          recipientId: targetUserId,
          // Include profile info to create the conversation immediately
          profile: {
            id: profile.id,
            businessName: profile.businessName,
            userId: targetUserId,
            user: profile.user || { id: targetUserId, name: profile.businessName || 'Pengguna' }
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat percakapan");
      }

      // 2. Redirect ke halaman chat dengan conversation ID dan forceRefresh untuk memastikan data terbaru
      const conversationId = data.conversation?.id || data.id;
      if (conversationId) {
        // Force a hard navigation to ensure the chat page loads fresh data
        window.location.href = `/chat?conversationId=${conversationId}&t=${Date.now()}`;
      } else {
        // Fallback ke halaman chat biasa jika tidak ada ID
        window.location.href = '/chat';
      }
      
      toast.success("Percakapan berhasil dibuat");
    } catch (err) {
      console.error("Gagal membuka percakapan:", err);
      toast.error("Gagal membuka percakapan");
    } finally {
      toast.dismiss(loadingToast);
    }
  };


  // UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold">Kolaborasi UMKM</h1>
                <p className="text-muted-foreground">
                  Temukan partner bisnis potensial di sini.
                </p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => handleCategoryChange("")}
                className={`px-4 py-2 rounded-full text-sm font-medium ${!selectedCategory
                    ? "bg-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
              >
                Semua Kategori
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === c
                      ? "bg-primary text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">Direktori Masih Kosong</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Jadilah yang pertama melengkapi profil bisnis Anda!
              </p>
              <Button onClick={() => router.push("/profile")}>
                Buat Profil Bisnis
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Own Profile */}
              {usersOwnProfile && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Profil Bisnis Anda
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-2 border-primary relative">
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-primary text-white">
                          Milik Anda
                        </Badge>
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>
                              {usersOwnProfile.businessName}
                            </CardTitle>
                            <CardDescription>
                              {usersOwnProfile.category}
                            </CardDescription>
                          </div>
                          <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {usersOwnProfile.description ||
                            "Tidak ada deskripsi."}
                        </p>
                        <Link
                          href={`/profile/${usersOwnProfile.id}`}
                          passHref
                          legacyBehavior
                        >
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <a>Kelola Profil</a>
                          </Button>
                        </Link>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {usersOwnProfile.location ||
                              "Lokasi belum ditentukan"}
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              )}

              {/* Other UMKMs */}
              {filteredProfiles.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">UMKM Lainnya</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((profile) => (
                      <Card key={profile.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{profile.businessName}</CardTitle>
                              <CardDescription>{profile.category}</CardDescription>
                            </div>
                            <Building className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {profile.description || "Tidak ada deskripsi."}
                          </p>
                          <div className="flex flex-col space-y-2">
                            <Link
                              href={`/profile/${profile.id}`}
                              passHref
                              legacyBehavior
                            >
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <a>Lihat Detail</a>
                              </Button>
                            </Link>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full flex items-center gap-2"
                              onClick={() => handleContact(profile)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>Hubungi</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
