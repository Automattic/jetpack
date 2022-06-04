import deprecatedV1 from './v1';
import deprecatedV2 from './v2';
import deprecatedV3 from './v3';
import deprecatedV4 from './v4';
import deprecatedV5 from './v5';
import deprecatedV6 from './v6';

// Deprecations should run in reverse chronological order. Most probable
// deprecations to run are the most recent. This ordering makes the process
// a little more performant.
export default [
	deprecatedV6,
	deprecatedV5,
	deprecatedV4,
	deprecatedV3,
	deprecatedV2,
	deprecatedV1,
];
