/**
 * Polling interval in milliseconds.
 */
export const POLL_INTERVAL = 3_000;

/**
 * Consecutive poll failures tolerated before polling gives up. A transient
 * error (a network blip, a 500) is retried on the next tick; only a sustained
 * run of failures stops polling and surfaces a terminal error.
 */
export const MAX_POLL_FAILURES = 3;

/**
 * Jetpack core sync status endpoint (queue + full-sync state).
 */
export const SYNC_STATUS_PATH = '/jetpack/v4/sync/status';

/**
 * Jetpack core full-sync trigger endpoint.
 */
export const FULL_SYNC_PATH = '/jetpack/v4/sync/full-sync';

/**
 * Sync-module key whose progress gates the analytics dashboard. Mirrors the
 * backend default (`Sync_Status_Tracker::ANALYTICS_SYNC_MODULE`).
 */
export const ANALYTICS_SYNC_MODULE = 'woocommerce_analytics';
