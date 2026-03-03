# PingHub Yjs Provider

A Yjs provider for Gutenberg that enables real-time collaborative editing via PingHub WebSockets. It uses persistent WebSocket connections through a hidden iframe bridge to the WordPress.com REST proxy, providing push-based, low-latency updates.

## Architecture

```
┌─────────────────┐                              ┌─────────────────┐
│    Client A      │                             │    Client B     │
│  ┌───────────┐  │                              │  ┌───────────┐  │
│  │  Y.Doc    │  │                              │  │  Y.Doc    │  │
│  │ Awareness │  │                              │  │ Awareness │  │
│  └─────┬─────┘  │                              │  └─────┬─────┘  │
│        │        │                              │        │        │
│  ┌─────┴─────┐  │                              │  ┌─────┴─────┐  │
│  │ PingHub   │  │                              │  │ PingHub   │  │
│  │ Provider  │  │                              │  │ Provider  │  │
│  └─────┬─────┘  │                              │  └─────┴─────┘  │
│  ┌─────┴─────┐  │                              │  ┌─────┴─────┐  │
│  │  Iframe   │  │                              │  │  Iframe   │  │
│  │  Bridge   │  │                              │  │  Bridge   │  │
│  └─────┬─────┘  │                              │  └─────┬─────┘  │
└────────┼────────┘                              └────────┼────────┘
         │                                                │
         │            WebSocket (PingHub)                 │
         └────────────────────┬───────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  WordPress.com    │
                    │  PingHub Service  │
                    │  (WebSocket relay)│
                    └───────────────────┘
```

## File Structure

| File              | Role                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| `index.ts`        | Public exports: `PingHubIframeBridge`, `createPingHubProvider`, all types   |
| `types.ts`        | Shared TypeScript interfaces and types                                     |
| `constants.ts`    | Named constants (proxy URLs, chunk sizes, message types, reconnect delays) |
| `utils.ts`        | Pure utility functions (base64, chunking, text conversion, proxy response normalization) |
| `pinghub-bridge.ts` | `PingHubIframeBridge` class: WebSocket communication with PingHub via the REST proxy iframe |
| `pinghub-provider.ts` | `PingHubProvider` class + `createPingHubProvider` factory: Yjs sync protocol, awareness, reconnection logic |

## Usage

### Basic Setup

```ts
import { PingHubIframeBridge, createPingHubProvider } from './providers/pinghub';
```

#### 1. Create a shared bridge

A single `PingHubIframeBridge` instance manages the hidden iframe and multiplexes all PingHub channels over it. Create one per page:

```ts
const bridge = new PingHubIframeBridge();
```

The bridge automatically:
- Reuses an existing REST-proxy iframe if one is already in the DOM.
- Creates and appends a hidden iframe if none exists.
- Waits for the iframe to signal readiness before sending any messages.

#### 2. Register the provider creator

Pass the bridge to `createPingHubProvider` to get a `ProviderCreator` compatible with Gutenberg's sync manager:

```ts
import { addFilter } from '@wordpress/hooks';

const providerCreator = createPingHubProvider( bridge );

addFilter( 'sync.providers', 'my-plugin/pinghub', ( providers ) => {
    return [ ...providers, providerCreator ];
} );
```

The sync manager calls the provider creator for each entity being edited. Currently only `postType/post` entities with a non-null `objectId` get a PingHub channel; all other entity types receive a no-op provider.

#### 3. Listen for connection status

```ts
const result = await providerCreator( { objectType, objectId, ydoc, awareness } );

result.on( 'status', ( { status } ) => {
    // status: 'connecting' | 'connected' | 'disconnected'
    console.log( 'PingHub status:', status );
} );
```

#### 4. Clean up

```ts
result.destroy();
```

This broadcasts a final awareness removal to peers and tears down all listeners. Window-level event handlers are automatically removed when the last provider is destroyed.

### Using the Bridge Directly

The bridge can also be used independently of the Yjs provider for lower-level PingHub communication:

```ts
const bridge = new PingHubIframeBridge();

// Connect to a channel
await bridge.connect( '/pinghub/wpcom/rtc/12345/my-channel' );

// Listen for events
bridge.onOpen( path, () => console.log( 'connected' ) );
bridge.onClose( path, ( code, reason ) => console.log( 'closed', code, reason ) );
bridge.onMessage( path, ( data: Uint8Array ) => {
    console.log( 'received', data );
} );

// Send binary data (chunking is handled automatically)
bridge.send( path, new Uint8Array( [ 1, 2, 3 ] ) );

// Disconnect
await bridge.disconnect( path );
```

## How It Works

### 1. Initialization

When the editor loads, `gutenberg-rtc.ts` checks `window.wpcomGutenbergRTC.providers` for enabled providers. If `"pinghub"` is present, it creates a shared `PingHubIframeBridge` and registers a `ProviderCreator` via the `sync.providers` filter.

Gutenberg's sync manager calls the provider creator for each entity being edited. Currently only `postType/post` entities with a non-null `objectId` get a PingHub channel; all other entity types (collections, patterns, etc.) receive a no-op provider.

### 2. Channel Path

Each post maps to a PingHub channel:

```
/pinghub/wpcom/rtc/{blogId}/{objectType}-{objectId}
```

For example: `/pinghub/wpcom/rtc/12345/postType-post-42`

The blog ID is resolved from WordPress globals (`_currentSiteId`, `wpcomGutenberg.blogId`, or `currentBlogId`).

### 3. Iframe Bridge

The bridge embeds a hidden iframe from the WordPress.com REST proxy (`https://public-api.wordpress.com/wp-admin/rest-proxy/`). All WebSocket traffic flows through this iframe via `postMessage`, which handles authentication via cookie-auth without exposing credentials to the parent page.

#### Iframe Communication

| Direction | Format | Description |
| --- | --- | --- |
| Parent → Iframe | JSON `postMessage` | `{ type: 'pinghub-proxy', action: 'connect' \| 'disconnect' \| 'send', path, ... }` |
| Iframe → Parent | `"ready"` string | Iframe initialized |
| Iframe → Parent | JSON (array or object) | Proxy responses: open, close, message, error — identified by callback ID |

The bridge sends binary payloads as **base64-encoded strings** in the JSON `message` field. Incoming message data arrives as base64 strings (decoded to `Uint8Array`), `ArrayBuffer`, or `Blob`.

#### Chunking

PingHub has a per-frame size limit. The bridge automatically **chunks** outgoing messages larger than 256 bytes and **reassembles** incoming chunked frames:

- Messages ≤ 256 bytes are sent as a single frame.
- Larger messages are split into chunks of up to 251 bytes (256 minus the 5-byte chunk header).
- Each chunk frame: `[0xFE magic, msgId high, msgId low, totalChunks, chunkIndex, ...payload]`.
- The receiver buffers chunks by `path:msgId` and delivers the full reassembled message once all chunks arrive.

Both sender and receiver handle chunking transparently — the provider layer sees only complete `Uint8Array` messages.

### 4. Wire Protocol

Every message sent by the provider is a `Uint8Array` with the following structure:

```
[varuint senderClientID] [varuint msgType] [type-specific payload]
```

The `senderClientID` prefix lets each client filter out its own messages (echoed back by PingHub's broadcast relay).

| `msgType` | Value | Payload |
| --- | --- | --- |
| `MSG_SYNC` | `0x00` | Yjs sync protocol data (sync step 1, sync step 2, or update) |
| `MSG_AWARENESS` | `0x01` | `varuint8array`-encoded awareness update |

### 5. Sync Protocol

The Yjs sync handshake runs over the PingHub channel:

1. **Client A connects** → sends `sync_step1` (its state vector) as a `MSG_SYNC` frame.
2. **PingHub relays** the message to all other subscribers on the channel.
3. **Client B receives** → processes the sync step, generates `sync_step2` (the updates A is missing), and sends it back. Because this is pub/sub (not point-to-point), Client B also sends its own `sync_step1` the first time it sees a peer's `sync_step1`, so both sides complete the handshake.
4. **Ongoing edits** → each client sends `MSG_SYNC` update frames for every Yjs `update` event (ignoring updates originated from `pinghub-remote` to avoid echo loops).

### 6. Awareness

Awareness state (presence, cursor positions) is synchronized alongside document updates:

- **On connect**: the provider broadcasts the local awareness state to all peers.
- **On local change**: awareness updates (`added`, `updated`, `removed` client IDs) are sent immediately as `MSG_AWARENESS` frames.
- **On remote message**: incoming awareness updates are applied locally via `y-protocols/awareness`.
- **On page hide**: the provider broadcasts a removal for the local client ID so peers immediately learn the user has left (uses synchronous `postMessage` which survives page teardown).
- **On destroy**: a final awareness removal is broadcast before tearing down listeners.

### 7. Reconnection

When the WebSocket connection drops:

1. Emit `disconnected` status (suppressed during page unload to avoid a brief flash).
2. Schedule a reconnect with **exponential backoff**: starting at 1 s, doubling each attempt, capped at 30 s.
3. Emit `connecting` before each retry.
4. On success: `onWsOpen` fires, re-sends `sync_step1` and broadcasts awareness.
5. When the tab returns to the foreground (`visibilitychange`), any disconnected providers reconnect immediately (backoff resets).

### 8. Connection Status

The provider emits `status` events compatible with Gutenberg's `ConnectionStatus` interface:

| Status | When |
| --- | --- |
| `connecting` | Initial connection or reconnect attempt |
| `connected` | WebSocket open, sync step 1 sent |
| `disconnected` | WebSocket closed or provider destroyed |

### 9. Lifecycle

Window-level event handlers are shared across all active `PingHubProvider` instances:

- `beforeunload` → sets an unload flag so `onWsClose` suppresses the disconnect status.
- `pagehide` → broadcasts awareness removal for every active provider.
- `visibilitychange` → reconnects any disconnected providers when the tab becomes visible.

Listeners are registered when the first provider is created and removed when the last one is destroyed.
