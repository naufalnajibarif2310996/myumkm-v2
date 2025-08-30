import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sari Dewi",
    role: "Pemilik Toko Kue Sari",
    avatar: "/images/avatar-male.webp",
    content:
      "My UMKM benar-benar mengubah cara saya mengelola bisnis. Sekarang saya bisa fokus pada produksi karena semua administrasi sudah terotomatisasi.",
    rating: 5,
  },
  {
    name: "Budi Santoso",
    role: "Pengusaha Fashion",
    avatar: "/images/avatar-male.webp",
    content:
      "Fitur toko online di My UMKM sangat mudah digunakan. Penjualan online saya meningkat 300% dalam 3 bulan pertama!",
    rating: 5,
  },
  {
    name: "Maya Putri",
    role: "Pemilik Warung Makan",
    avatar: "/images/avatar-male.webp",
    content:
      "Laporan analitik yang disediakan sangat membantu saya memahami pola pembelian pelanggan. Recommended banget!",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container px-4">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300">
            ⭐ Testimoni
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Apa Kata Mereka?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dengarkan cerita sukses dari para pelaku UMKM yang telah merasakan manfaat bergabung dengan My UMKM.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
