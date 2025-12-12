"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import pdfToText from "react-pdftotext";
import { useRouter } from "next/navigation";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string>("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user?.id]);

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
        onClick={() => {
          if (userId) {
            router.push(`/chat/${userId}`);
          } else {
            setMessage("Please wait for user data to load");
            setStatus("error");
          }
        }}
        disabled={!userId || status === "uploading"}
        className="text-white bg-slate-700 rounded-4xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Go to Chat
      </Button>
    </div>
  );
}
