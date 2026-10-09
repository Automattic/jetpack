const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const { createRequire } = require( 'node:module' );
const path = require( 'node:path' );
const { test } = require( 'node:test' );

const packageRoot = path.resolve( __dirname, '../..' );
const localRequire = createRequire( path.join( packageRoot, 'package.json' ) );

const modules = {
	boot: '@wordpress/boot',
	route: '@wordpress/route',
	a11y: '@wordpress/a11y',
	'widget-primitives': '@wordpress/widget-primitives',
};

for ( const [ name, packageName ] of Object.entries( modules ) ) {
	test( `build/modules/${ name }/version.php returns the bundled ${ packageName } version`, () => {
		const file = path.join( packageRoot, 'build/modules', name, 'version.php' );
		const expected = JSON.parse(
			fs.readFileSync( localRequire.resolve( `${ packageName }/package.json` ), 'utf8' )
		).version;

		assert.equal( fs.readFileSync( file, 'utf8' ), `<?php return '${ expected }';\n` );
	} );
}
