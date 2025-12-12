"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import pdfToText from "react-pdftotext";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const { user } = useUser();
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    setUserId(user?.id || "");
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setStatus("uploading");
    setFile(f);
    pdfToText(f as File)
      .then((text) => {
        setText(text);
        // console.log("Extracted text length:", text);
        if (text.length === 0) {
          throw new Error("Not text extracted");
        }
        setStatus("idle");
      })
      .catch((error) => console.error("Failed to extract text from pdf"));
  };
  const onUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF file first.");
      setStatus("error");
      return;
    }
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      setStatus("error");
      return;
    }

    try {
      setStatus("uploading");
      setMessage("");
      const form = new FormData();
      form.append("pdf", file);
      form.append("text", text);
      const res = await fetch("/api/store-pdf", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Upload failed with ${res.status}`);
      }

      const data = await res.json();
      setStatus("success");
      setUserId(data?.user_id || "");
      setMessage(
        `Uploaded: ${data?.name || file.name} (${Math.round(
          (data?.size || file.size) / 1024
        )} KB)`
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-3.5 items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">Upload a PDF</h1>
        <input type="file" accept="application/pdf" onChange={onFileChange} />
        <button
          onClick={onUpload}
          disabled={!file || status === "uploading"}
          className="inline-flex items-center px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading..." : "Upload"}
        </button>
        {!!message && (
          <p className={status === "error" ? "text-red-600" : "text-green-700"}>
            {message}
          </p>
        )}
      </div>
      <Button
        onClick={() => (window.location.href = `/chat/${userId}`)}
        className="text-white bg-slate-700 rounded-4xl"
      >
        Go to Chat
      </Button>
    </div>
  );
}
