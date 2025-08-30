"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormProps {
  businessProfileId: string;
  onFormSubmit: () => void;
}

export function ProductForm({ businessProfileId, onFormSubmit }: ProductFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price) || 0,
          category,
          authorId: businessProfileId,
        }),
      });

      if (res.ok) {
        onFormSubmit();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menambahkan item.");
      }
    } catch (err) {
      setError("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul Produk/Jasa</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Harga (kosongkan jika jasa)</Label>
        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Kategori Produk/Jasa</Label>
        <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
