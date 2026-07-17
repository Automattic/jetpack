/* global __dirname */
/**
 * Shared validation logic for the boot module asset file.
 *
 * Used by both the post-build CLI script and the test suite.
 */

const { readFileSync, existsSync } = require( 'fs' );
const path = require( 'path' );

// Script handles registered by WordPress Core (wp_default_scripts).
// This list should be kept in sync with Core's wp-includes/script-loader.php.
const CORE_SCRIPT_HANDLES = new Set( [
	'react',
	'react-dom',
	'react-jsx-runtime',
	'wp-a11y',
	'wp-api-fetch',
	'wp-blob',
	'wp-block-directory',
	'wp-block-editor',
	'wp-block-library',
	'wp-block-serialization-default-parser',
	'wp-blocks',
	'wp-commands',
	'wp-components',
	'wp-compose',
	'wp-core-data',
	'wp-customize-widgets',
	'wp-data',
	'wp-data-controls',
	'wp-date',
	'wp-deprecated',
	'wp-dom',
	'wp-dom-ready',
	'wp-edit-post',
	'wp-edit-site',
	'wp-edit-widgets',
	'wp-editor',
	'wp-element',
	'wp-escape-html',
	'wp-format-library',
	'wp-hooks',
	'wp-html-entities',
	'wp-i18n',
	'wp-is-shallow-equal',
	'wp-keyboard-shortcuts',
	'wp-keycodes',
	'wp-list-reusable-blocks',
	'wp-media-utils',
	'wp-notices',
	'wp-nux',
	'wp-plugins',
	'wp-preferences',
	'wp-preferences-persistence',
	'wp-primitives',
	'wp-priority-queue',
	'wp-private-apis',
	'wp-redux-routine',
	'wp-reusable-blocks',
	'wp-rich-text',
	'wp-server-side-render',
	'wp-shortcode',
	'wp-style-engine',
	'wp-token-list',
	'wp-url',
	'wp-viewport',
	'wp-warning',
	'wp-widgets',
	'wp-wordcount',
] );

// Handles polyfilled by this package.
const POLYFILL_HANDLES = new Set( [ 'wp-notices', 'wp-private-apis', 'wp-theme' ] );

/**
 * Parse dependency handles from a PHP asset file's content.
 *
 * @param {string} content - The PHP file content.
 * @return {string[]} Array of handle strings, or empty array if parsing fails.
 */
function parseHandles( content ) {
	const depsMatch = content.match( /dependencies.*?array\(([^)]*)\)/ );
	if ( ! depsMatch ) {
		return [];
	}
	return depsMatch[ 1 ].match( /'([^']+)'/g )?.map( s => s.replace( /'/g, '' ) ) ?? [];
}

/**
 * Validate the boot module's asset file.
 *
 * @param {string} [assetFilePath] - Optional path to the asset file. Defaults to the build output.
 * @return {{ ok: boolean, error?: string, unknownHandles?: string[], handles?: string[] }} Validation result.
 */
function validateBootAsset( assetFilePath ) {
	const assetFile =
		assetFilePath || path.join( __dirname, '..', 'build', 'modules', 'boot', 'index.asset.php' );

	if ( ! existsSync( assetFile ) ) {
		return {
			ok: false,
			error: `Boot asset file not found at ${ assetFile }`,
		};
	}

	const content = readFileSync( assetFile, 'utf8' );
	const handles = parseHandles( content );

	if ( handles.length === 0 ) {
		return {
			ok: false,
			error: 'Could not parse dependencies from asset file.',
		};
	}

	const unknownHandles = handles.filter(
		h => ! CORE_SCRIPT_HANDLES.has( h ) && ! POLYFILL_HANDLES.has( h )
	);

	if ( unknownHandles.length > 0 ) {
		return {
			ok: false,
			handles,
			unknownHandles,
			error:
				'Boot module asset file contains script handles not registered by ' +
				'WordPress Core or this polyfill package:\n' +
				unknownHandles.map( h => `   - ${ h }` ).join( '\n' ) +
				'\n\n' +
				'This will cause a silent failure at runtime (blank page, no errors).\n' +
				'Fix: Add the corresponding @wordpress/* package to devDependencies in\n' +
				'projects/packages/wp-build-polyfills/package.json so webpack can\n' +
				'resolve it and bundle it instead of externalizing it.',
		};
	}

	return { ok: true, handles };
}

module.exports = { validateBootAsset, parseHandles, CORE_SCRIPT_HANDLES, POLYFILL_HANDLES };
