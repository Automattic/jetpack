/* global process */
import BaseEnvironment from 'jetpack-js-tools/jest/fix-environment-jsdom.mjs';

// Read at import time, before any instance has changed it.
const PINNED_TZ = process.env.TZ;

/**
 * jsdom, with the worker's time zone pinned to the given zone.
 *
 * Must run here rather than in a test file: Jest sandboxes `process.env` per file, so a `TZ`
 * assignment there never reaches the ICU the runtime formats with.
 *
 * @param {string} timeZone - IANA zone the worker runs in.
 * @return {Function} An environment class Jest can instantiate.
 */
export const zonedEnvironment = timeZone =>
	class ZonedEnvironment extends BaseEnvironment {
		constructor( config, context ) {
			process.env.TZ = timeZone;
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
	};
