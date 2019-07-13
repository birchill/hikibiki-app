declare module 'mock-http-server' {
  type HTTPConfig = {
    host: string;
    port: number;
  };

  type HTTPSConfig = {
    host: string;
    port: number;
    key: string;
    cert: string;
  };

  type Handler = {
    method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS' | '*';
    path: string;
    filter?: (request: any) => boolean;
    reply: Reply;
  };

  type Reply = {
    status?: number;
    headers?: object;
    headersOverrides?: object;
    body?: string | SyncReplyFn | AsyncReplyFn;
    end?: boolean;
    delay?: number;
  };

  type SyncReplyFn = (request: any) => string;
  type AsyncReplyFn = (request: any, reply: (body: string) => void) => void;

  export class ServerMock {
    constructor(httpConfig?: HTTPConfig, httpsConfig?: HTTPSConfig);
    start: (callback: () => void) => void;
    stop: (callback: () => void) => void;
    on: (handler: Handler) => ServerMock;
    requests: (filter: string) => Array<any>;
    connections: () => Array<any>;

    getHttpPort: () => string | null;
    getHttpsPort: () => string;
  }

  export default ServerMock;
}
