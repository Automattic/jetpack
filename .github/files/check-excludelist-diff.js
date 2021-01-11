#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console, no-process-exit */

const parseDiff = require( 'parse-diff' );
const spawnSync = require( 'child_process' ).spawnSync;

const res = spawnSync(
	'git',
	[ 'diff', 'bin/eslint-excludelist.json', 'bin/phpcs-excludelist.json' ],
	{
		stdio: [ null, 'pipe', 'inherit' ],
		maxBuffer: Infinity,
		encoding: 'utf8',
	}
);
if ( res.status ) {
	process.exit( res.status );
}

const diff = parseDiff( res.stdout );
const lines = [];
diff.forEach( file => {
	file.chunks.forEach( chunk => {
		chunk.changes.forEach( c => {
			let x;
			switch ( c.type ) {
				case 'add':
					console.log( "::error::Huh? There shouldn't be any added lines." );
					process.exit( 1 );
					break;
				case 'del':
					x = c.content.replace( /^-\s*|,?\s*$/g, '' );
					lines.push(
						`::warning file=${ file.to },line=${ c.ln }::Good job! ${ x } no longer has any lint errors, and should be removed from the exclude list.`
					);
					break;
				case 'normal':
					break;
			}
		} );
	} );
} );

console.log( lines.join( '\n' ) );
process.exit( lines.length > 0 );
