/**
 * Proxy
 */
export const IFRAME_SRC_BASE = 'https://public-api.wordpress.com/wp-admin/rest-proxy/';

export const PROXY_ORIGIN = 'https://public-api.wordpress.com';

export const PROXY_ALREADY_SUBSCRIBED = 444; // Status code the proxy returns when the path is already subscribed.

/**
 * Chunking
 */
export const CHUNK_MAGIC = 0xfe;
export const CHUNK_HEADER_LEN = 5; // magic(1) + msgId(2) + totalChunks(1) + chunkIndex(1)
export const MAX_PAYLOAD_BEFORE_CHUNK = 256; // Messages larger than this are split into chunks so each frame stays under backend limits.

/**
 * Yjs message types
 */
export const MSG_SYNC = 0x00;
export const MSG_AWARENESS = 0x01;

/**
 * Reconnection options
 */
export const RECONNECT_BASE_DELAY_MS = 1000;
export const RECONNECT_MAX_DELAY_MS = 30 * 1000;
