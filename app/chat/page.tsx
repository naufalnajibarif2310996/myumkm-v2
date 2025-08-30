"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

// ================== Helpers ==================
const withAuth = (WrappedComponent: React.ComponentType) => {
  return function AuthenticatedComponent() {
    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
      if (!user) {
        // router.push("/login");
      }
    }, [user, router]);

    if (!user || !token) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      );
    }

    return <WrappedComponent />;
  };
};

// ================== Types ==================
interface User {
  id: string;
  name: string;
  email?: string;
  role: "USER" | "ADMIN" | "SELLER" | string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  conversationId?: string;
}

interface Conversation {
  id: string;
  users: User[];
  messages: Message[];
  lastMessage?: Message;
  updatedAt?: string;
  isLoading?: boolean;
}

// ================== Component ==================
function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, getToken } = useAuth();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current user
  const currentUser: User | null = useMemo(() => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      name: authUser.name || "Saya",
      email: authUser.email,
      role: "USER",
    };
  }, [authUser]);
  const currentUserId = currentUser?.id;

  // Sorted messages
  const sortedMessages = useMemo(() => {
    const sorted = [...messages]
      .filter(msg => msg && msg.createdAt)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    console.log("Sorted messages to render:", sorted);
    return sorted;
  }, [messages]);

  // ================== API ==================
  const getAuthToken = useCallback(() => {
    const currentToken = getToken();
    if (!currentToken) {
      console.error("No authentication token available");
      return null;
    }
    return currentToken;
  }, [getToken]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    console.log("fetchMessages called with conversationId:", conversationId);
    const token = getAuthToken();
    if (!token) return;

    try {
      setSelectedConversation(prev =>
        prev?.id === conversationId ? { ...prev, isLoading: true } : prev
      );

      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(await res.text());

      // ⬇️ hasil query API langsung array of messages
      const data = await res.json();
      const msgs: Message[] = data.messages || data || [];
      console.log("Fetched messages:", msgs);

      setMessages(msgs);

      setSelectedConversation(prev =>
        prev?.id === conversationId
          ? {
            ...prev,
            isLoading: false,
            lastMessage: msgs[msgs.length - 1] || prev.lastMessage,
          }
          : prev
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Gagal memuat pesan");
    }
  }, [getAuthToken]);

  const fetchConversations = useCallback(async () => {
    console.log("Fetching conversations...");
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch("/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat percakapan");

      if (data.conversations) {
        setConversations(data.conversations);
        if (!selectedConversation && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
          fetchMessages(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      toast.error("Gagal memuat percakapan");
    }
  }, [getAuthToken, selectedConversation, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      createdAt: new Date().toISOString(),
      user: currentUser!,
      conversationId: selectedConversation.id,
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: tempMessage.content,
          conversationId: tempMessage.conversationId,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const saved = data.message || data;

      setMessages(prev => prev.map(m => (m.id === tempMessage.id ? saved : m)));
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Gagal mengirim pesan");
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  // ================== Effects ==================
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages]);

  // ================== Render ==================
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <DashboardSidebar />
        <div className="flex-1 grid grid-cols-3">
          {/* Conversations */}
          <div className="col-span-1 border-r flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Pesan</h2>
              <Button variant="ghost" size="icon" onClick={fetchConversations}>
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map(c => {
                const otherUser = c.users.find(u => u.id !== currentUserId) || c.users[0];
                const isSelected = selectedConversation?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`p-4 border-b cursor-pointer ${isSelected ? "bg-accent" : ""}`}
                    onClick={() => {
                      setSelectedConversation(c);
                      fetchMessages(c.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {otherUser?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <h3 className="font-medium">{otherUser?.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {c.lastMessage?.content || "Tidak ada pesan"}
                        </p>
                      </div>
                    </div>
                  </div>

                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="border-b p-4 bg-card">
                  {(() => {
                    const otherUser = selectedConversation.users.find(u => u.id !== currentUserId);
                    return (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold">{otherUser?.name || 'Pengguna'}</h2>
                          <p className="text-xs text-muted-foreground">
                            {otherUser?.email || 'Sedang online'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-muted">
                  {selectedConversation.isLoading ? (
                    <p className="text-center text-muted-foreground">Memuat pesan...</p>
                  ) : sortedMessages.length > 0 ? (
                    sortedMessages.map(msg => {
                      const isMe = msg.user?.id === currentUserId;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`px-3 py-2 rounded-xl max-w-xs ${isMe ? "bg-primary text-white" : "bg-card border"
                              }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {isMe ? "Anda" : msg.user?.name} •{" "}
                              {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground">Belum ada pesan</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 flex gap-3 border-t">
                  <Input
                    placeholder="Ketik pesan..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" disabled={!newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Pilih percakapan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ChatPage);
