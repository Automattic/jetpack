/**
 * @jest-environment node
 */
import path from 'path';

const { findSharedImports } = require(
	path.join(
		path.dirname( require.resolve( '@wordpress/build/package.json' ) ),
		'lib/shared-modules-manifest.mjs'
	)
);

const ids = new Set( [ '@jetpack-shared/ui', '@jetpack-shared/api' ] );
const imports = source =>
	Object.fromEntries(
		[ ...findSharedImports( source, ids ) ].map( ( [ id, names ] ) => [ id, [ ...names ].sort() ] )
	);

describe( 'findSharedImports', () => {
	it.each( [
		[
			'named with as',
			'import{Button as t,Badge}from"@jetpack-shared/ui";',
			{ '@jetpack-shared/ui': [ 'Badge', 'Button' ] },
		],
		[ 'default', 'import e from"@jetpack-shared/ui";', { '@jetpack-shared/ui': [ 'default' ] } ],
		[
			'default and named',
			'import e,{Badge as b}from"@jetpack-shared/ui";',
			{ '@jetpack-shared/ui': [ 'Badge', 'default' ] },
		],
		[ 'namespace', 'import*as e from"@jetpack-shared/ui";', { '@jetpack-shared/ui': [ '*' ] } ],
		[
			'named re-export',
			'export{Badge}from"@jetpack-shared/ui";',
			{ '@jetpack-shared/ui': [ 'Badge' ] },
		],
		[ 'star re-export', 'export*from"@jetpack-shared/ui";', { '@jetpack-shared/ui': [ '*' ] } ],
		[ 'bare import', 'import"@jetpack-shared/ui";', { '@jetpack-shared/ui': [] } ],
		[
			'dynamic import',
			'const m=import("@jetpack-shared/api");',
			{ '@jetpack-shared/api': [ '*' ] },
		],
		[ 'id not in the set', 'import{a}from"@jetpack-shared/other";import"react";', {} ],
		[
			'several statements',
			'import{Badge}from"@jetpack-shared/ui";import{apiFetch as f}from"@jetpack-shared/api";import{Card}from"@jetpack-shared/ui";',
			{ '@jetpack-shared/api': [ 'apiFetch' ], '@jetpack-shared/ui': [ 'Badge', 'Card' ] },
		],
	] )( '%s', ( _, source, expected ) => {
		expect( imports( source ) ).toEqual( expected );
	} );
} );
