#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console, no-process-exit */

const spawnSync = require( 'child_process' ).spawnSync;
const parseDiff = require( 'parse-diff' );

const res = spawnSync(
	'git',
	[ 'diff', 'tools/eslint-excludelist.json', 'tools/phpcs-excludelist.json' ],
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
let exit = 0;
diff.forEach( file => {
	const lines = [];
	let anyAdded = false;
	file.chunks.forEach( chunk => {
		if ( anyAdded ) {
			return;
		}
		chunk.changes.forEach( c => {
			let x;
			switch ( c.type ) {
				case 'add':
					anyAdded = true;
					return;
				case 'del':
					x = c.content.replace( /^-\s*|,?\s*$/g, '' );
					lines.push(
						'---', // Bracket message containing newlines for better visibility in GH's logs.
						`::warning file=${ file.to },line=${ c.ln }::Good job! ${ x } no longer has any lint errors,%0Aand should be removed from the exclude list.`,
						'---'
					);
					break;
				case 'normal':
					break;
			}
		} );
	} );
	if ( anyAdded ) {
		exit = 1;
		console.log( '---' ); // Bracket message containing newlines for better visibility in GH's logs.
		console.log(
			`::error file=${ file.to }::When checking for fixed exclusions, CI found added lines.%0AThis probably means you didn't maintain binary sort order when editing this file.%0APlease fix.`
		);
		console.log( '---' );
	} else if ( lines.length ) {
		exit = 1;
		console.log( lines.join( '\n' ) );
	}
} );

process.exit( exit );
