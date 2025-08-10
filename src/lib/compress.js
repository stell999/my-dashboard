// في ملف src/lib/compress.js
export async function compressData(data) {
  const stream = new Blob([JSON.stringify(data)]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  return await new Response(compressedStream).arrayBuffer();
}

export async function decompressData(buffer) {
  const stream = new Blob([buffer]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(decompressedStream).text());
}