const assert = require( 'node:assert/strict' );
const { existsSync, readFileSync } = require( 'node:fs' );
const { it, describe } = require( 'node:test' );
const path = require( 'path' );

const assetFile = path.join(
	__dirname,
	'..',
	'..',
	'build',
	'scripts',
	'rich-text',
	'index.asset.php'
);
const bundleFile = path.join( __dirname, '..', '..', 'build', 'scripts', 'rich-text', 'index.js' );

// The rich-text polyfill exists because Core < 7.1 rich-text lacks the
// `privateApis` export newer dashboard dependencies unlock at module scope.
// rich-text itself unlocks `privateApis` from @wordpress/compose at module
// scope (`subscribeDelegatedListener`), and Core < 7.1 compose lacks that
// export too — so compose must be bundled into this polyfill, never
// externalized to `wp.compose`, or the polyfill throws the very error it
// exists to fix ("Cannot unlock an undefined object").
describe(
	'rich-text polyfill build',
	{ skip: ! existsSync( assetFile ) && 'run `pnpm run build` first' },
	() => {
		it( 'does not externalize @wordpress/compose to the incomplete core script', () => {
			const asset = readFileSync( assetFile, 'utf8' );
			assert.doesNotMatch( asset, /'wp-compose'/ );
		} );

		it( 'still externalizes stable core packages', () => {
			const asset = readFileSync( assetFile, 'utf8' );
			assert.match( asset, /'wp-element'/ );
			assert.match( asset, /'wp-private-apis'/ );
		} );

		it( 'bundles the compose private APIs rich-text unlocks at module scope', () => {
			const bundle = readFileSync( bundleFile, 'utf8' );
			assert.match( bundle, /subscribeDelegatedListener/ );
		} );
	}
);
