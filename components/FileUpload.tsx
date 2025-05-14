"use client";
import { Inbox, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";

// import {} from ''
const FileUpload = () => {
  const router=useRouter()
  const [uploading, setUploading] = useState(false);
  const { mutate } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      //console.log(file_key,file_name)
      const res = await axios.post("/api/create-chat", { file_key, file_name });
      return res.data;
    },
  });

  const { getInputProps, getRootProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        const result = await res.json();
        //console.log("Upload result:", result);
        if (!result?.file_key || !result?.file_name) {
          alert("Something went wrong");
          return;
        }
        mutate(result, {
          onSuccess: (chat_id) => {
            // console.log(typeof(chat_id.chat_id))
            const chatId=chat_id.chat_id as string
            router.push(`/chat/${chatId}`)
          },
          onError: (err) => {
            //console.log(err);
          },
        });
      } catch (error) {
        //console.log(error);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 flex py-8 justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-10 w-10 text-blue-700 animate-spin" />
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-600" />
            <p className="mt-2 text-sm text-slate-400">Drop a PDF here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
