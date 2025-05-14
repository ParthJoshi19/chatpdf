import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import ChatComponent from "@/components/ChatComponents";

type Prop = {
  params: {
    chatId: string;
  };
};

const Chatpage = async (props: Prop) => {
  const { chatId } = await props.params;
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats) {
    return;
  }
  if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
    return;
  }

  const currChat=_chats.find(chat=>chat.id===parseInt(chatId))

  return (
    <div className="flex max-h-screen">
      <div className="flex w-full max-h-screen overflow-y-scroll">
        <div className="flex-[1] max-w-xs">
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)}/>
        </div>
        <div className="max-h-screen p-4 overflow-scroll flex-[5]">
          <PDFViewer pdf_url={currChat?.pdfUrl || ''}/>
        </div>
        <div className="flex-[3] border-l-4 border-l-slate-200">
          <ChatComponent chatId={parseInt(chatId)}/>
        </div>
      </div>
    </div>
  );
};

export default Chatpage;
