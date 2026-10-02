"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequestQueue = void 0;
/**
 * Manages concurrent fetching with a queue system.
 * Tracks request lifecycle through queued → pending states
 * and limits concurrency to prevent overwhelming the server.
 */
class RequestQueue {
  pendingRequests = new Map();
  queuedRequests = new Map();
  constructor(options) {
    this.fetchFn = options.fetchFn;
    this.maxConcurrentRequests = options.maxConcurrentRequests ?? Infinity;
    this.getKeyId = options.getKeyId ?? String;
  }

  /**
   * Returns the next `count` entries to process from the queue.
   * Default is FIFO (oldest first). Subclasses can override for different ordering.
   */
  pickEntries(count) {
    const result = [];
    const iterator = this.queuedRequests.entries();
    for (let i = 0; i < count; i += 1) {
      const {
        value
      } = iterator.next();
      result.push(value);
    }
    return result;
  }
  processQueue = async () => {
    if (this.queuedRequests.size === 0 || this.pendingRequests.size >= this.maxConcurrentRequests) {
      return;
    }
    const loopLength = Math.min(this.maxConcurrentRequests - this.pendingRequests.size, this.queuedRequests.size);
    if (loopLength === 0) {
      return;
    }
    const fetchPromises = [];
    for (const [keyId, key] of this.pickEntries(loopLength)) {
      this.queuedRequests.delete(keyId);
      this.pendingRequests.set(keyId, key);
      fetchPromises.push(this.fetchFn(key).catch(() => {
        this.pendingRequests.delete(keyId);
      }));
    }
    await Promise.all(fetchPromises);
    if (this.queuedRequests.size > 0) {
      await this.processQueue();
    }
  };
  queue = async keys => {
    for (const key of keys) {
      const keyId = this.getKeyId(key);
      if (!this.pendingRequests.has(keyId)) {
        this.queuedRequests.set(keyId, key);
      }
    }
    await this.processQueue();
  };
  setRequestSettled = async key => {
    const keyId = this.getKeyId(key);
    this.pendingRequests.delete(keyId);
    await this.processQueue();
  };
  clear = () => {
    this.queuedRequests.clear();
    this.pendingRequests.clear();
  };
  clearPendingRequest = async key => {
    const keyId = this.getKeyId(key);
    this.pendingRequests.delete(keyId);
    await this.processQueue();
  };
  getRequestStatus = key => {
    const keyId = this.getKeyId(key);
    if (this.pendingRequests.has(keyId)) {
      return 'pending';
    }
    if (this.queuedRequests.has(keyId)) {
      return 'queued';
    }
    return 'unknown';
  };
}
exports.RequestQueue = RequestQueue;