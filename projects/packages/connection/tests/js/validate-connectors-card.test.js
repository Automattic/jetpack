const assert = require( 'node:assert/strict' );
const { describe, it } = require( 'node:test' );
const { checkConnectorsCard, SIZE_LIMIT } = require( '../../bin/validate-connectors-card-lib.js' );

const validBuild = {
	asset: {
		dependencies: [ 'jetpack-connection' ],
		module_dependencies: [ { id: '@wordpress/connectors', import: 'static' } ],
		version: 'abc',
		type: 'module',
	},
	jsFiles: [ 'connectors-card.js' ],
	bundle: 'import*as e from"@wordpress/connectors";',
	size: 1000,
};

describe( 'checkConnectorsCard', () => {
	const broken = [
		[ 'an asset file that returns no array', { asset: null }, /associative array/ ],
		[ 'a classic asset', { asset: { ...validBuild.asset, type: undefined } }, /type/ ],
		[
			'a dynamic @wordpress/connectors import',
			{
				asset: {
					...validBuild.asset,
					module_dependencies: [ { id: '@wordpress/connectors', import: 'dynamic' } ],
				},
			},
			/not a static module dependency/,
		],
		[ 'a split chunk', { jsFiles: [ 'connectors-card.js', '123.js' ] }, /one JS file/ ],
		[ 'a bundled React', { bundle: 'react-stack-bottom-frame' }, /bundled React/ ],
		[ 'an oversized bundle', { size: SIZE_LIMIT + 1 }, /limit/ ],
	];

	for ( const [ name, override, expected ] of broken ) {
		it( `rejects ${ name }`, () => {
			const errors = checkConnectorsCard( { ...validBuild, ...override } );
			assert.equal( errors.length, 1, errors.join( '\n' ) );
			assert.match( errors[ 0 ], expected );
		} );
	}
} );
