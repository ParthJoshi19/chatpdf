export function cleanText(text: string): string {
  return text
    .replace(/\r/g, " ")              // remove carriage returns
    .replace(/\n+/g, "\n")            // collapse multiple newlines
    .replace(/\s+/g, " ")             // collapse spaces
    .replace(/•/g, "")                // remove bullet points if needed
    .trim();
}

export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200
): string[] {
  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end).trim();
    chunks.push(chunk);

    start += chunkSize - overlap; // slide window
  }

  return chunks;
}

export function prepareChunks(rawText: string): string[] {
  const cleaned = cleanText(rawText);
  const chunks = chunkText(cleaned, 1000, 200); 

  return chunks;
}