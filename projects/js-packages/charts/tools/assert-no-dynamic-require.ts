/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Rolldown emits a throwing `__require` shim when a bundled CommonJS dependency
// requires a package we mark external (e.g. `react`). That is harmless in the
// `.cjs` output, but the `.js` output is consumed by @wordpress/build as a
// WordPress Script Module — native browser ESM, where `require` does not exist.
// The shim then throws during *module evaluation*, taking down every consumer of
// the module rather than just the feature that pulled the dependency in.
const SHIM_PATTERNS = [ /__require\d*\s*\(/, /Dynamic require of/, /rolldown\.rs\/in-depth\// ];

/**
 * Collects every ESM output file (`.js`) under a directory.
 *
 * @param {string} dir - Directory to walk.
 * @return {string[]} Absolute paths of ESM bundles.
 */
function esmBundles( dir: string ): string[] {
	return readdirSync( dir, { withFileTypes: true } ).flatMap( entry => {
		const path = join( dir, entry.name );
		if ( entry.isDirectory() ) {
			return esmBundles( path );
		}
		return entry.name.endsWith( '.js' ) ? [ path ] : [];
	} );
}

/**
 * Fails the build if any ESM bundle contains a dynamic `require` shim.
 *
 * @param {string} distDir - The build output directory.
 * @throws {Error} When a shim is found.
 */
export function assertNoDynamicRequire( distDir: string ): void {
	const offenders = esmBundles( distDir ).filter( file => {
		const code = readFileSync( file, 'utf8' );
		return SHIM_PATTERNS.some( pattern => pattern.test( code ) );
	} );

	if ( offenders.length === 0 ) {
		return;
	}

	throw new Error(
		`Dynamic require shim found in ESM output:\n` +
			offenders.map( file => `  - ${ file }` ).join( '\n' ) +
			`\n\nA bundled CommonJS dependency is calling require() for an external package. ` +
			`This throws "Dynamic require of ... is not supported" during module evaluation in ` +
			`WordPress Script Module consumers (premium-analytics, publicize, videopress, podcast), ` +
			`breaking every widget on those screens — not just the feature that pulled it in.\n\n` +
			`Find the culprit with: pnpm run build:prod && grep -n '__require' dist/index.js\n` +
			`Then avoid the CommonJS dependency (prefer an ESM-only alternative) rather than ` +
			`suppressing this check.`
	);
}
