import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

const benefits = [
  "Gratis selamanya untuk fitur dasar",
  "Setup dalam 5 menit",
  "Dukungan 24/7",
  "Tanpa kontrak jangka panjang",
]

export function CTASection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Siap Mengembangkan UMKM Anda?</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan UMKM lainnya yang telah merasakan kemudahan mengelola bisnis dengan My UMKM.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-base" asChild>
              <Link href="/register">
                Daftar Gratis Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 hover:border-white"
            >
              Hubungi Tim Sales
            </Button>
          </div>

          <p className="text-sm text-blue-200">Tidak perlu kartu kredit • Setup instan • Dukungan penuh</p>
        </div>
      </div>
    </section>
  )
}
