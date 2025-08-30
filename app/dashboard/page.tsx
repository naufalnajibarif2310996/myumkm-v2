"use client";

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, FileText, DollarSign, MessageSquare } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalPosts: number;
  totalMessages: number;
  recentProducts: Array<{
    id: string;
    title: string;
    price: number;
    category: string;
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    createdAt: string;
    authorName: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) return;

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch semua data sekaligus
        const [usersRes, productsRes, postsRes, chatRes] = await Promise.allSettled([
          fetch('/api/users', { headers, credentials: 'include', cache: 'no-store' }),
          fetch('/api/marketplace', { headers, credentials: 'include', cache: 'no-store' }),
          fetch('/api/forum', { headers, credentials: 'include', cache: 'no-store' }),
          fetch('/api/chat', { headers, credentials: 'include', cache: 'no-store' }),
        ]);

        // Helper untuk handle response
        const handleResponse = async (result: PromiseSettledResult<Response>, name: string) => {
          if (result.status === 'fulfilled') {
            if (!result.value.ok) {
              console.error(`Failed to fetch ${name}:`, result.value.status);
              return [];
            }
            try {
              return await result.value.json();
            } catch (e) {
              console.error(`Error parsing ${name}:`, e);
              return [];
            }
          } else {
            console.error(`Error fetching ${name}:`, result.reason);
            return [];
          }
        };

        // Ambil data masing-masing
        const [users, products, posts, chat] = await Promise.all([
          handleResponse(usersRes, 'users'),
          handleResponse(productsRes, 'products'),
          handleResponse(postsRes, 'posts'),
          handleResponse(chatRes, 'chat'),
        ]);

        // Hitung total pesan dari semua conversation
        const totalMessages = Array.isArray(chat.conversations)
          ? chat.conversations.reduce((acc: number, convo: any) => {
            // Jika kamu ingin hitung 1 pesan per conversation saja
            // bisa pakai 1 saja, atau jika ada array messages, gunakan convo.messages.length
            // Saat ini dari data yang kamu tunjukkan, setiap convo punya lastMessage
            return acc + (convo.lastMessage ? 1 : 0);
          }, 0)
          : 0;

        // Recent products (last 4)
        const recentProducts = Array.isArray(products)
          ? products.slice(0, 4).map((p: any) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            category: p.category
          }))
          : [];

        // Recent posts (last 4)
        const recentPosts = Array.isArray(posts)
          ? posts.slice(0, 4).map((p: any) => ({
            id: p.id,
            title: p.title,
            createdAt: p.createdAt,
            authorName: p.author?.businessName || 'Unknown Author'
          }))
          : [];

        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalPosts: Array.isArray(posts) ? posts.length : 0,
          totalMessages,
          recentProducts,
          recentPosts
        });

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  const statsCards = [
    {
      title: "Total Produk",
      value: stats?.totalProducts || 0,
      change: "+12%",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Pengguna Aktif",
      value: stats?.totalUsers || 0,
      change: "+8%",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Artikel Diterbitkan",
      value: stats?.totalPosts || 0,
      change: "+3%",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Total Pesan",
      value: stats?.totalMessages || 0,
      change: "+15%",
      icon: MessageSquare,
      color: "text-yellow-600",
    },
  ];

  // Display error message if any
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
              <p className="mt-2">Mengarahkan ke halaman login...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 p-6">
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
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
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Selamat datang kembali! Berikut ringkasan aktivitas UMKM Anda.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span> dari bulan lalu
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Produk Terbaru</CardTitle>
                  <CardDescription>Produk terbaru yang ditambahkan ke marketplace</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentProducts && stats.recentProducts.length > 0 ? (
                      stats.recentProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{product.title}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            Rp {product.price.toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada produk</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Postingan Terbaru</CardTitle>
                  <CardDescription>Postingan terbaru di forum komunitas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentPosts && stats.recentPosts.length > 0 ? (
                      stats.recentPosts.map((post) => (
                        <div key={post.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.authorName} • {new Date(post.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada postingan</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
