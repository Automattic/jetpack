/**
 * CLI option parsing, kept out of bin/verify-port.js so it can be unit-tested -- importing
 * the entry point would run `main()`.
 */

import { parseArgs } from 'util';
import { DEFAULT_IGNORED_QUERY_PARAMS, DEFAULT_TOLERANCE_PX } from './selectors.js';

export const OPTION_SPEC = {
	url: { type: 'string' },
	flag: { type: 'string' },
	user: { type: 'string' },
	pass: { type: 'string' },
	'control-selector': { type: 'string' },
	'wait-selector': { type: 'string' },
	tolerance: { type: 'string' },
	'ignore-query-param': { type: 'string', multiple: true, default: [] },
	out: { type: 'string' },
	before: { type: 'string' },
	after: { type: 'string' },
	headed: { type: 'boolean', default: false },
	help: { type: 'boolean', default: false },
};

/**
 * An unparseable value must not reach the diff as `NaN`: every `delta > NaN` is false, so
 * step 2 would report OK for every target however far it moved.
 *
 * @param {string|undefined} raw
 * @return {number}
 */
function parseTolerance( raw ) {
	if ( raw === undefined ) {
		return DEFAULT_TOLERANCE_PX;
	}
	const value = Number( raw );
	if ( ! Number.isFinite( value ) || value < 0 ) {
		throw new Error( `--tolerance must be a non-negative number of pixels, got "${ raw }".` );
	}
	return value;
}

/**
 * @param {string[]} argv  - Everything after the subcommand.
 * @param {object}   [env] - Defaults to `process.env`.
 * @return {object} Parsed options, camel-cased from `OPTION_SPEC`'s kebab-case keys.
 */
export function parseOptions( argv, env = process.env ) {
	const { values } = parseArgs( { args: argv, options: OPTION_SPEC, allowPositionals: false } );
	const extraIgnoreParams = values[ 'ignore-query-param' ];
	return {
		url: values.url,
		flag: values.flag,
		username: values.user ?? env.WP_ADMIN_USER,
		password: values.pass ?? env.WP_ADMIN_PASS,
		controlSelector: values[ 'control-selector' ],
		waitForSelector: values[ 'wait-selector' ],
		tolerancePx: parseTolerance( values.tolerance ),
		ignoreQueryParams: extraIgnoreParams.length
			? [ ...DEFAULT_IGNORED_QUERY_PARAMS, ...extraIgnoreParams ]
			: undefined,
		out: values.out,
		before: values.before,
		after: values.after,
		headless: ! values.headed,
		help: values.help,
	};
}
