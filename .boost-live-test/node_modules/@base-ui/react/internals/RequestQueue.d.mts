export type RequestStatus = 'queued' | 'pending' | 'unknown';
export interface RequestQueueOptions<TKey> {
  /**
   * The function to call when a queued key is ready to be fetched.
   */
  fetchFn: (key: TKey) => Promise<void>;
  /**
   * The maximum number of concurrent requests.
   * @default Infinity
   */
  maxConcurrentRequests?: number | undefined;
  /**
   * Serialize a key to a string for use as a map key.
   * Required for complex key types (e.g., objects).
   * @default String(key)
   */
  getKeyId?: ((key: TKey) => string) | undefined;
}
/**
 * Manages concurrent fetching with a queue system.
 * Tracks request lifecycle through queued → pending states
 * and limits concurrency to prevent overwhelming the server.
 */
export declare class RequestQueue<TKey> {
  protected pendingRequests: Map<string, TKey>;
  protected queuedRequests: Map<string, TKey>;
  protected fetchFn: (key: TKey) => Promise<void>;
  protected maxConcurrentRequests: number;
  protected getKeyId: (key: TKey) => string;
  constructor(options: RequestQueueOptions<TKey>);
  /**
   * Returns the next `count` entries to process from the queue.
   * Default is FIFO (oldest first). Subclasses can override for different ordering.
   */
  protected pickEntries(count: number): [string, TKey][];
  protected processQueue: () => Promise<void>;
  queue: (keys: TKey[]) => Promise<void>;
  setRequestSettled: (key: TKey) => Promise<void>;
  clear: () => void;
  clearPendingRequest: (key: TKey) => Promise<void>;
  getRequestStatus: (key: TKey) => RequestStatus;
}