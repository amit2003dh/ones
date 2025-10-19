declare module 'node-imap' {
  import { EventEmitter } from 'events';
  
  interface ImapConfig {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
    tlsOptions?: {
      rejectUnauthorized?: boolean;
    };
  }

  interface Box {
    name: string;
    flags: string[];
    readOnly: boolean;
    uidvalidity: number;
    uidnext: number;
    permFlags: string[];
    keywords: string[];
    newKeywords: boolean;
    persistentUIDs: boolean;
    messages: {
      total: number;
      new: number;
    };
  }

  interface ImapMessage extends EventEmitter {
    on(event: 'body', listener: (stream: NodeJS.ReadableStream, info: any) => void): this;
    on(event: 'attributes', listener: (attrs: any) => void): this;
    on(event: 'end', listener: () => void): this;
    once(event: 'body', listener: (stream: NodeJS.ReadableStream, info: any) => void): this;
    once(event: 'attributes', listener: (attrs: any) => void): this;
    once(event: 'end', listener: () => void): this;
  }

  interface ImapFetch extends EventEmitter {
    on(event: 'message', listener: (msg: ImapMessage, seqno: number) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'end', listener: () => void): this;
  }

  class Connection extends EventEmitter {
    constructor(config: ImapConfig);
    
    once(event: 'ready', listener: () => void): this;
    once(event: 'error', listener: (err: Error) => void): this;
    once(event: 'end', listener: () => void): this;
    
    on(event: 'mail', listener: (numNewMsgs: number) => void): this;
    on(event: 'expunge', listener: (seqno: number) => void): this;
    
    connect(): void;
    end(): void;
    openBox(mailboxName: string, readOnly: boolean, callback: (err: Error | null, box?: Box) => void): void;
    search(criteria: any[], callback: (err: Error | null, results: number[]) => void): void;
    fetch(source: any, options: any): ImapFetch;
    idle(): void;
    
    state: string;
  }

  export = Connection;
}
