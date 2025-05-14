import { NextRequest, NextResponse } from "next/server";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const fileKey = req.nextUrl.searchParams.get("file_key");
    
    const fileUrl=`https://res.cloudinary.com/dngqp3rve/raw/upload/v1746964361/chatpdf-folder/${fileKey}`;
    //console.log(fileUrl)
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing 'url' query param" }, { status: 400 });
    }

    const buffer = await downloadToBuffer(fileUrl);
    const fileName = `cloud-file-${Date.now()}.pdf`;
    const filePath = path.join(os.tmpdir(), fileName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ fileName: filePath });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Uint8Array[] = [];

      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}
