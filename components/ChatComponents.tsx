"use client";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import MessageList from "./MessageList";
import { useEffect, useState } from "react";
import axios from "axios";

type Message = {
  id:string,
  role: "user" | "assistant";
  content: string;
};

type Props = {chatId:number};

const ChatComponent = ({chatId}: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input, id: "user/"+Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage],chatId }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();
      const assistantMessage = data.messages[0];
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(()=>{
    const getHistoryMsg=async()=>{
      const res=await axios.post("/api/get-messages",{chatId});
      setMessages(res.data);
    } 
    getHistoryMsg();
  },[])

  useEffect(()=>{
    const msgCon=document.getElementById("msg-container");
    if(msgCon){
      msgCon.scrollTo({
        top:msgCon.scrollHeight,
        behavior:"smooth"
      })
    }
  },[messages])

  return (
    <div className="relative max-h-screen overflow-scroll" id="msg-container">
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h1 className="text-xl font-bold">Chat</h1>
      </div>

      <MessageList messages={messages} />
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 flex inset-x-0 px-2 py-4 bg-white"
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Any Question..."
          className="w-[90%] flex"
        />
        <Button className="bg-blue-600 ml-2">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
