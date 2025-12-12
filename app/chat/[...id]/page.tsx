"use client";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Menu, X, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface Chat {
  id: string;
  original_filename: string;
  cloudinary_url: string;
  created_at: string;
}

export default function ChatPage() {
  const { isLoaded, isSignedIn } = useUser();
  const params = useParams();
  const router = useRouter();
  const activeId = Array.isArray((params as any)?.id)
    ? (params as any).id[0]
    : (params as any)?.id;
  const [message, setMessage] = useState<string>("");
  const [socket, setSocket] = useState<any>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPdfPanel, setShowPdfPanel] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState<boolean>(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Check if activeId exists, redirect if not
  useEffect(() => {
    if (isLoaded && isSignedIn && !activeId) {
      router.push("/new-chat");
    }
  }, [activeId, isLoaded, isSignedIn, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render the page if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingChats(true);
        setChatsError(null);
        const response = await fetch("/api/chats");
        const data = await response.json();
        if (response.ok) {
          setChats(data.documents || []);
          const initialId = (typeof activeId === 'string' && activeId) || (data.documents?.[0]?.id ?? null);
          setActiveChatId(initialId);
        } else {
          setChatsError(data?.error || 'Failed to load chats');
        }
      } catch (e:any) {
        setChatsError(e?.message || 'Failed to load chats');
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    const s = io("http://localhost:3000");

    s.on("connect", () => {
      console.log("Connected:", s.id);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const [messages, setMessages] = useState<
    {
      id: string;
      role: "user" | "assistant";
      content: string;
      created_at: string;
    }[]
  >([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const id = activeChatId || (typeof activeId === 'string' ? activeId : null);
      if (!id) return;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(String(id))) {
        console.warn('Invalid document id, expected UUID:', id);
        setMessages([]);
        return;
      }
      try {
        setLoadingMessages(true);
        setMessagesError(null);
        const res = await fetch(
          `/api/messages?documentId=${encodeURIComponent(id as string)}`
        );
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
        } else {
          setMessagesError(data?.error || 'Failed to load messages');
          setMessages([]);
        }
      } catch (e:any) {
        setMessagesError(e?.message || 'Failed to load messages');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeId, activeChatId]);

  useEffect(() => {
    if (!socket) return;
    const onAgentMessage = (data: { text: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.text,
          created_at: new Date().toISOString(),
        },
      ]);

      // Persist assistant message
      const id = activeChatId || (typeof activeId === 'string' ? activeId : null);
      if (id) {
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: id, content: data.text, role: 'assistant' }),
        }).catch((err) => {console.error("Failed to save assistant message", err);});
      }
    };

    socket.on("agent_message", onAgentMessage);
    return () => {
      socket.off("agent_message", onAgentMessage);
    };
  }, [socket, activeId, activeChatId]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;

    // Emit to socket
    if (socket) {
      socket.emit("user_message", { text , pdfId:activeChatId });
    }

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    // Persist to API
    const id = activeChatId || (typeof activeId === 'string' ? activeId : null);
    if (id) {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: id, content: text, role: 'user' }),
        });
      } catch {}
    }

    setMessage("");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Chat List */}
      <aside
        className={cn(
          "bg-card border-r transition-all duration-300 overflow-hidden flex flex-col",
          showSidebar ? "w-80" : "w-0"
        )}
      >
        <div className="p-4 border-b">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => (window.location.href = "/new-chat")}
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loadingChats && (
              <div className="text-sm text-muted-foreground">Loading chats...</div>
            )}
            {chatsError && (
              <div className="text-sm text-destructive">{chatsError}</div>
            )}
            {!loadingChats && !chatsError && chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto p-4 hover:bg-accent",
                  (activeChatId || (typeof activeId === 'string' ? activeId : null)) === chat.id ? 'bg-accent' : ''
                )}
                onClick={() => { setActiveChatId(chat.id); router.push(`/chat/${chat.id}`) }}
              >
                <div className="flex items-start gap-3 w-full">
                  <FileText
                    size={20}
                    className="text-muted-foreground mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-medium text-foreground truncate">
                      {chat.original_filename}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {chat.created_at}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Middle Section - Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <h1 className="text-xl font-semibold">Research Paper Analysis</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPdfPanel(!showPdfPanel)}
            className="ml-auto lg:hidden"
          >
            <FileText size={20} />
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {loadingMessages && (
              <div className="text-sm text-muted-foreground">Loading messages...</div>
            )}
            {messagesError && (
              <div className="text-sm text-destructive">{messagesError}</div>
            )}
            {!loadingMessages && !messagesError && messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-3xl px-6 py-4 rounded-2xl",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="bg-card border-t p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask anything about your document..."
                  className="h-12"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                size="icon"
                className="h-12 w-12"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Panel - PDF Preview */}
      <aside
        className={cn(
          "bg-card border-l transition-all duration-300 overflow-hidden flex flex-col",
          showPdfPanel ? "w-96" : "w-0"
        )}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold">Document Preview</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {(() => {
              const active = chats.find(c => c.id === (activeChatId || (typeof activeId === 'string' ? activeId : null)));
              const url = active?.cloudinary_url;
              if (!url) {
                return (
                  <div className="bg-muted rounded-lg aspect-[8.5/11] flex items-center justify-center">
                    <div className="text-center">
                      <FileText size={48} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">PDF Preview</p>
                    </div>
                  </div>
                );
              }
              return (
                <iframe
                  src={url}
                  className="w-full aspect-[8.5/11] rounded-lg border"
                  title="PDF Preview"
                />
              );
            })()}
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Toggle Buttons */}
      <div className="fixed bottom-6 right-6 flex gap-2 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          className="rounded-full shadow-lg"
        >
          <Menu size={20} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowPdfPanel(!showPdfPanel)}
          className="rounded-full shadow-lg"
        >
          <FileText size={20} />
        </Button>
      </div>
    </div>
  );
}
