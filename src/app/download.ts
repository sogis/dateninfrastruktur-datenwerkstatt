export async function downloadStream(
  stream: ReadableStream<Uint8Array>,
  name: string,
  mediaType: string,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const reader = stream.getReader();
  const parts: Uint8Array<ArrayBuffer>[] = [];
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener('abort', abort, {once: true});
  try {
    for (;;) {
      const next = await reader.read();
      signal?.throwIfAborted();
      if (next.done) break;
      parts.push(new Uint8Array(next.value));
    }
  } finally {
    signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
  signal?.throwIfAborted();
  const blob = new Blob(parts, {type: mediaType});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  link.click();
  // Give the browser download manager time to consume the URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
