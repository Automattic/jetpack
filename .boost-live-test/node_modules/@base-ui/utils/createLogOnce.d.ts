/** Creates a dev-only logger that writes each unique message to `console[severity]` once. */
export declare function createLogOnce(severity: 'warn' | 'error', prefix?: string): (...messages: string[]) => void;
export declare function reset(): void;