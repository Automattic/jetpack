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
	test( `build/modules/${ name }/index.asset.php carries the bundled ${ packageName } version`, () => {
		const asset = fs.readFileSync(
			path.join( packageRoot, 'build/modules', name, 'index.asset.php' ),
			'utf8'
		);
		const expected = JSON.parse(
			fs.readFileSync( localRequire.resolve( `${ packageName }/package.json` ), 'utf8' )
		).version;

		assert.ok( asset.includes( `'package_version' => '${ expected }'` ) );
	} );
}
