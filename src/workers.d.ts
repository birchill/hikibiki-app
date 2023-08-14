// TypeScript typings are missing this it seems
interface Worker {
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null;
}
