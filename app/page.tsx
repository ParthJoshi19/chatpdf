"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { FileText, MessageSquare, Zap, Lock, Search, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isLoaded && isSignedIn) {
      router.push("/new-chat");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Chat with Your PDFs
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Upload any PDF and have intelligent conversations with your documents. 
            Get instant answers powered by AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#6c47ff] hover:bg-[#5a3ad6] text-white rounded-full font-semibold text-lg h-14 px-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl">
                  Get Started Free
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button 
                onClick={handleGetStarted}
                disabled={!isLoaded}
                className="bg-[#6c47ff] hover:bg-[#5a3ad6] text-white rounded-full font-semibold text-lg h-14 px-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoaded ? "Start Chatting" : "Loading..."}
              </button>
            </SignedIn>
            <a href="#features" className="text-foreground hover:text-[#6c47ff] font-semibold text-lg transition-colors">
              Learn More →
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Powerful Features
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Everything you need to interact with your documents intelligently
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-10 h-10 text-[#6c47ff]" />}
              title="PDF Upload"
              description="Easily upload and manage multiple PDF documents in one place"
            />
            <FeatureCard 
              icon={<MessageSquare className="w-10 h-10 text-[#6c47ff]" />}
              title="Intelligent Chat"
              description="Ask questions and get accurate answers from your documents instantly"
            />
            <FeatureCard 
              icon={<Zap className="w-10 h-10 text-[#6c47ff]" />}
              title="Lightning Fast"
              description="Get responses in seconds with our optimized AI processing"
            />
            <FeatureCard 
              icon={<Search className="w-10 h-10 text-[#6c47ff]" />}
              title="Smart Search"
              description="Find relevant information across all your documents effortlessly"
            />
            <FeatureCard 
              icon={<Lock className="w-10 h-10 text-[#6c47ff]" />}
              title="Secure & Private"
              description="Your documents are encrypted and stored securely"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-3xl p-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform How You Read?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who are chatting with their documents
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#6c47ff] hover:bg-[#5a3ad6] text-white rounded-full font-semibold text-lg h-14 px-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl">
                Start Free Now
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button 
              onClick={handleGetStarted}
              disabled={!isLoaded}
              className="bg-[#6c47ff] hover:bg-[#5a3ad6] text-white rounded-full font-semibold text-lg h-14 px-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoaded ? "Go to Dashboard" : "Loading..."}
            </button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 ChatPDF. Built with Next.js, Clerk, and AI.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
