"use client";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { UserButton, useAuth } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { userId } = useAuth();
  const isAuth = !!userId;
  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with PDF</h1>
            <UserButton afterSwitchSessionUrl="/" />
          </div>
          <div className="flex mt-2">
            {isAuth && <Button>Go to Chats</Button>}
          </div>
          <p className="max-w-xl mt-2 text-lg text-slate-600">
            Join millions of Students,researchers,and professionals to instantly
            answer questions and understand research with AI
          </p>
          <div className="w-full mt-4 ">
            {isAuth ? (
              <FileUpload/>
            ) : (
              <Link href="/sign-up">
                <Button>Login to get Started! 
                  <LogIn></LogIn>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
