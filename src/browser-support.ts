export function hasReadableStreamSupport(): boolean {
  try {
    new Response(
      new ReadableStream({
        start(controller: ReadableStreamDefaultController<Uint8Array>) {
          controller.enqueue(new TextEncoder().encode('yer'));
          controller.close();
        },
      })
    );
    return true;
  } catch (e) {
    return false;
  }
}
