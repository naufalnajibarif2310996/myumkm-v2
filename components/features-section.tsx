import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Users, Lightbulb, Banknote, Heart, BarChart3, Bot, BookOpen } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "AI & Otomatisasi Pemasaran",
    description: "Auto-generate konten promosi, jadwal posting ke sosial media, dan analisis engagement untuk rekomendasi strategi.",
  },
  {
    icon: Users,
    title: "Kolaborasi Antar-UMKM",
    description: "Marketplace internal, forum komunitas, dan fitur “Cari Partner” untuk mendorong joint venture.",
  },
  {
    icon: Lightbulb,
    title: "Rekomendasi Produk & Tren AI",
    description: "Dapatkan rekomendasi produk/jasa yang potensial di area Anda berdasarkan analisis tren lokal oleh AI.",
  },
  {
    icon: Banknote,
    title: "Akses Keuangan & Pendanaan",
    description: "Integrasi dengan fintech, catatan keuangan sederhana, dan platform crowdfunding internal untuk UMKM.",
  },
  {
    icon: Heart,
    title: "Manajemen Loyalitas Pelanggan",
    description: "Buat kartu member digital, kupon diskon custom, dan kirim reminder otomatis untuk pelanggan setia.",
  },
  {
    icon: BarChart3,
    title: "Analisis Kompetitor Lokal",
    description: "Bandingkan harga produk Anda dengan kompetitor sekitar dan dapatkan insight strategis.",
  },
  {
    icon: Bot,
    title: "Asisten Virtual (Chatbot AI)",
    description: "Aktifkan chatbot AI tanpa coding untuk menjawab pertanyaan pelanggan secara otomatis di berbagai platform.",
  },
  {
    icon: BookOpen,
    title: "Sistem Edukasi Interaktif",
    description: "Akses kursus singkat berbasis video & quiz, serta dapatkan bimbingan dari mentor bisnis lokal.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container px-4">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            ✨ Fitur Unggulan
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Semua yang Anda Butuhkan</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Platform lengkap dengan fitur-fitur canggih yang dirancang khusus untuk membantu UMKM berkembang pesat di
            era digital.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
