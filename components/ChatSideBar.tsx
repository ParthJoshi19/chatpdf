"use client";
import { DrizzleChat } from "@/lib/db/schema";
import { Button } from "./ui/button";
import Link from "next/link";
import { MessageCircle, PlusCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSideBar = ({ chats, chatId }: Props) => {
  return (
    <div className="w-full h-screen p-4 text-gray-200 bg-gray-900">
      <Link href="/">
        <Button className="cursor-pointer w-full border-dashed border-white border-2">
          <PlusCircleIcon className="mr-2 w-4 h-4 " /> New Chat
        </Button>
      </Link>

      <div className="flex flex-col gap-2 mt-4">
        {chats.map(chat=>(
            <Link key={chat.id} href={`${chat.id}`}>
                <div className={cn('rounded-lg p-3 text-slate-300 flex items-center',{'bg-blue-500 text-white':chat.id===chatId,'hover:text-white':chat.id!==chatId})}>
                    <MessageCircle className="mr-2 w-4 h-4"/>
                    <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis">{chat.pdfName}</p>
                </div>
            </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatSideBar;
