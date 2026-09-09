/* global process */
import BaseEnvironment from 'jetpack-js-tools/jest/fix-environment-jsdom.mjs';

// Read at import time, before any instance has changed it.
const PINNED_TZ = process.env.TZ;

/**
 * jsdom, with the worker's time zone pinned to Pacific/Chatham.
 *
 * The counterpart to `environment-los-angeles.mjs`: a worker behind UTC renders a
 * UTC-midnight proxy on its own day, so it cannot tell UTC arithmetic from local.
 * Chatham is ahead of UTC, observes DST, and sits on a quarter hour.
 */
export default class ChathamEnvironment extends BaseEnvironment {
	constructor( config, context ) {
		process.env.TZ = 'Pacific/Chatham';
		super( config, context );
	}

	async teardown() {
		// Workers are reused, and the next file expects the script's own TZ.
		if ( PINNED_TZ === undefined ) {
			delete process.env.TZ;
		} else {
			process.env.TZ = PINNED_TZ;
		}
		await super.teardown();
	}
}
