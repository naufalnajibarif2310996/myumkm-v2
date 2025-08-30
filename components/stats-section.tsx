import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    number: "10,000+",
    label: "UMKM Terdaftar",
    description: "Bergabung dengan komunitas UMKM terbesar",
  },
  {
    number: "50M+",
    label: "Transaksi Diproses",
    description: "Volume transaksi yang telah dikelola",
  },
  {
    number: "99.9%",
    label: "Uptime Sistem",
    description: "Keandalan platform yang terjamin",
  },
  {
    number: "24/7",
    label: "Dukungan",
    description: "Tim support siap membantu kapan saja",
  },
]

export function StatsSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dipercaya Ribuan UMKM</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bergabunglah dengan komunitas UMKM yang terus berkembang dan rasakan dampak positifnya untuk bisnis Anda.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
