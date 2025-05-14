"use client";
import { cn } from "@/lib/utils";
import React from "react";
import ReactMarkdown from 'react-markdown'
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
type Props = {
  messages: Message[];
};
const MessageList = ({ messages }: Props) => {
  if (!messages) return <div>Nothing</div>;
  return (
    <div className="flex flex-col gap-2 px-4 ">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex ", {
            "justify-end pl-10": message.role === "user",
            "justify-start pr-10": message.role === "assistant",
          })}
        >
          <div
            className={cn(
              "rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10 ",
              {
                "bg-blue-600 text-white": message.role === "user",
                "bg-gray-100 text-black": message.role === "assistant",
              }
            )}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
            
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
