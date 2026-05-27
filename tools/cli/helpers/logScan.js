import fs from 'fs/promises';
import { execa } from 'execa';

const DEBUG_LOG = '/var/www/html/wp-content/debug.log';

const FATAL_PATTERNS = [
	// PHP 7+ Throwable-style errors thrown when autoloader can't find a symbol.
	/Uncaught\s+Error:\s+Class\s+["']([^"']+)["']\s+not\s+found/g,
	/Uncaught\s+Error:\s+Interface\s+["']([^"']+)["']\s+not\s+found/g,
	/Uncaught\s+Error:\s+Trait\s+["']([^"']+)["']\s+not\s+found/g,
	// PHP < 8 phrasing (still appears in dev logs).
	/Fatal\s+error:\s+Class\s+["']?([^"'\s]+)["']?\s+not\s+found/g,
];

/**
 * Find the running Jetpack dev WordPress container, if any.
 *
 * @return {Promise<string|null>} Container name, or null if none running.
 */
export async function findWordPressContainer() {
	try {
		const { stdout } = await execa(
			'docker',
			[
				'ps',
				'--filter',
				'name=jetpack_dev[_-]wordpress',
				'--filter',
				'status=running',
				'--format',
				'{{.Names}}',
			],
			{ reject: false }
		);
		const first = stdout
			.split( '\n' )
			.map( s => s.trim() )
			.filter( Boolean )[ 0 ];
		return first || null;
	} catch {
		return null;
	}
}

/**
 * Read the tail of the WordPress debug.log.
 *
 * Resolution order:
 * 1. Explicit `logPath` option (or `JETPACK_FASTBUILD_LOG` env var) → host-side file.
 * 2. Explicit `container` option → `docker exec`.
 * 3. Auto-detected Jetpack dev container → `docker exec`.
 * 4. Nothing available → returns `{ container: null, log: '' }`.
 *
 * @param {object} [options]           - Options.
 * @param {string} [options.container] - Container name (auto-detected when omitted).
 * @param {string} [options.logPath]   - Host-side path to debug.log (overrides docker).
 * @param {number} [options.lines]     - Number of trailing lines to read.
 * @return {Promise<{ container: string|null, source: string, log: string }>} Tail contents and where they came from.
 */
export async function readDebugLogTail( { container, logPath, lines = 500 } = {} ) {
	const effectiveLogPath = logPath || process.env.JETPACK_FASTBUILD_LOG || '';
	if ( effectiveLogPath ) {
		try {
			const data = await fs.readFile( effectiveLogPath, { encoding: 'utf8' } );
			const tail = data.split( '\n' ).slice( -lines ).join( '\n' );
			return { container: null, source: effectiveLogPath, log: tail };
		} catch {
			return { container: null, source: effectiveLogPath, log: '' };
		}
	}
	const name = container || ( await findWordPressContainer() );
	if ( ! name ) {
		return { container: null, source: '', log: '' };
	}
	try {
		const { stdout } = await execa(
			'docker',
			[ 'exec', name, 'tail', '-n', String( lines ), DEBUG_LOG ],
			{ reject: false }
		);
		return { container: name, source: `docker:${ name }`, log: stdout || '' };
	} catch {
		return { container: name, source: `docker:${ name }`, log: '' };
	}
}

/**
 * Extract the fully-qualified names of classes/interfaces/traits that the
 * autoloader couldn't resolve, newest occurrences first.
 *
 * @param {string} log - debug.log contents.
 * @return {string[]} Unique FQN strings, ordered from newest to oldest in the log.
 */
export function extractMissingSymbols( log ) {
	if ( ! log ) {
		return [];
	}
	const hits = [];
	for ( const pattern of FATAL_PATTERNS ) {
		pattern.lastIndex = 0;
		let m;
		while ( ( m = pattern.exec( log ) ) !== null ) {
			hits.push( { index: m.index, fqn: m[ 1 ].replace( /^\\+/, '' ) } );
		}
	}
	// Newest first: higher index in the log == later in time (tail is append-only).
	hits.sort( ( a, b ) => b.index - a.index );
	const seen = new Set();
	const unique = [];
	for ( const h of hits ) {
		if ( ! seen.has( h.fqn ) ) {
			seen.add( h.fqn );
			unique.push( h.fqn );
		}
	}
	return unique;
}

/**
 * Convenience: read the log and return missing-symbol FQNs in one call.
 *
 * @param {object} [options]           - Same options as readDebugLogTail.
 * @param {string} [options.container] - Container name (auto-detected when omitted).
 * @param {number} [options.lines]     - Number of trailing lines to read.
 * @return {Promise<{ container: string|null, missing: string[] }>} Result.
 */
export async function scanForMissingSymbols( options = {} ) {
	const { container, source, log } = await readDebugLogTail( options );
	return { container, source, missing: extractMissingSymbols( log ) };
}
