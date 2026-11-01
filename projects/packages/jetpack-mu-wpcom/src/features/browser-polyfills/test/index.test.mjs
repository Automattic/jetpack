import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import babel from '@babel/core';

test( 'the bundle includes polyfills the floor lacks and records its use', () => {
	const entry = new URL( '../index.js', import.meta.url ).pathname;
	// Runs the package's babel.config.js, as the build does.
	const { code } = babel.transformFileSync( entry, {
		cwd: new URL( '../../../../', import.meta.url ).pathname,
	} );
	assert.match( code, /core-js\/modules\/es\.array\.to-sorted/ );
	assert.doesNotMatch( code, /wp:polyfill/ );
	assert.match( code, /wpcom_browser_polyfill_used/ );
} );

test( 'only browsers missing a feature load the bundle, and never after the page has loaded', () => {
	const php = readFileSync( new URL( '../browser-polyfills.php', import.meta.url ), 'utf8' );
	const hasFeatures = php.match( /\$has_features = '([^']+)';/ )[ 1 ];
	const loadsBundle = ( globals, readyState = 'loading' ) =>
		! vm.runInNewContext( hasFeatures, {
			Object,
			Promise,
			Set,
			...globals,
			document: { readyState },
		} );

	assert.equal( loadsBundle( { Array } ), false );
	assert.equal( loadsBundle( { Array: { prototype: {} } } ), true );
	assert.equal( loadsBundle( { Array: { prototype: {} } }, 'complete' ), false );
} );
