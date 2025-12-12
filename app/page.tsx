"use client";

import { useUser } from "@clerk/nextjs";
import NewPage from "./new-chat/page";

export default function Home() {

  const {isLoaded} = useUser();

  if(!isLoaded){
    return <div>Loading...</div>
  }

  return (
    <NewPage/>
  );
}
