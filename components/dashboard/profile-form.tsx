"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileFormProps {
  existingProfile: {
    businessName: string;
    description: string | null;
    category: string;
    location: string | null;
  } | null;
  onFormSubmit: () => void;
}

interface User {
  id: string;
}

export function ProfileForm({ existingProfile, onFormSubmit }: ProfileFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch the current user to get their ID
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }
        
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setError("Failed to authenticate user. Please login again.");
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError("Network error. Please check your connection.");
      }
    };
    fetchUser();

    // Populate form with existing data if available
    if (existingProfile) {
      setBusinessName(existingProfile.businessName);
      setDescription(existingProfile.description || "");
      setCategory(existingProfile.category);
      setLocation(existingProfile.location || "");
    }
  }, [existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!businessName.trim()) {
      setError("Nama bisnis harus diisi");
      return;
    }
    
    if (!category) {
      setError("Kategori harus dipilih");
      return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Sesi Anda telah berakhir. Silakan login kembali.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    setSuccess(""); // Clear previous success message

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          description: description.trim(),
          category,
          location: location.trim()
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal menyimpan profil');
      }

      const data = await res.json();
      
      // Show success message and reset form
      setSuccess("Profil berhasil disimpan!");
      
      // Call the callback to refresh the parent component
      onFormSubmit();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Profile submission error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Nama Bisnis</Label>
        <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Pilih kategori bisnis..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Kuliner">Kuliner</SelectItem>
            <SelectItem value="Fashion">Fashion</SelectItem>
            <SelectItem value="Kerajinan Tangan">Kerajinan Tangan</SelectItem>
            <SelectItem value="Jasa">Jasa</SelectItem>
            <SelectItem value="Teknologi">Teknologi</SelectItem>
            <SelectItem value="Pertanian">Pertanian</SelectItem>
            <SelectItem value="Lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}
      <Button type="submit" disabled={isSubmitting || !user}>
        {isSubmitting ? "Menyimpan..." : "Simpan Profil"}
      </Button>
    </form>
  );
}
