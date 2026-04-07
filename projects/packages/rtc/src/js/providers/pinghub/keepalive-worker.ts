/**
 * Tiny Web Worker that sends a 'tick' message at a fixed interval.
 *
 * Web Worker timers are not throttled by browsers when the tab is in the
 * background, unlike main-thread setInterval which slows to ~1/min.
 * The main thread uses these ticks to re-broadcast awareness keepalives
 * so that remote peers don't time out this client after 30 seconds.
 */
setInterval( () => postMessage( 'tick' ), 25 * 1000 );
