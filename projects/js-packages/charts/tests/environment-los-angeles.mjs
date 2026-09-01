/* global process */
import BaseEnvironment from 'jetpack-js-tools/jest/fix-environment-jsdom.mjs';

// Read at import time, before any instance has changed it.
const PINNED_TZ = process.env.TZ;

/**
 * jsdom, with the worker's time zone pinned to America/Los_Angeles.
 *
 * `TZ=UTC` in the test script is what hid every time-zone bug in the date
 * formatters, but a test file cannot lift it: Jest sandboxes `process.env` per
 * file, so assigning `TZ` there never reaches the ICU the runtime formats with.
 * An environment runs in the worker's own process, outside that sandbox.
 */
export default class LosAngelesEnvironment extends BaseEnvironment {
	constructor( config, context ) {
		process.env.TZ = 'America/Los_Angeles';
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
