#!/usr/bin/env node

import { spawn } from 'child_process';
import chalk from 'chalk';

/**
 * Exec a command and collect the lines.
 *
 * @param {string}   cmd     - Command.
 * @param {string[]} args    - Arguments.
 * @param {object}   options - Options.
 * @return {string[]} Lines of output.
 */
async function spawnAndReadStdout( cmd, args, options = {} ) {
	const lines = [];

	await new Promise( ( resolve, reject ) => {
		let buffer = '';

		const proc = spawn( cmd, args, {
			...options,
			stdio: [ 'ignore', 'pipe', 'inherit' ],
		} );

		proc.stdout.on( 'data', data => {
			buffer += data.toString();
			let i;
			while ( ( i = buffer.indexOf( '\n' ) ) >= 0 ) {
				lines.push( buffer.substring( 0, i ) );
				buffer = buffer.substring( i + 1 );
			}
		} );

		proc.on( 'close', code => {
			if ( buffer !== '' ) {
				lines.push( buffer );
			}
			if ( code !== 0 ) {
				reject( new Error( `Command failed with code ${ code }` ) );
			} else {
				resolve();
			}
		} );

		proc.on( 'error', err => {
			reject( err );
		} );
	} );

	return lines;
}

/**
 * Checks for filename collsisions on case-insensitive file systems.
 *
 * This is probably impossible to get 100% right due to potential locale
 * differences in filesystem case folding, but this should be most of the way there.
 */
async function checkFilenameCollisions() {
	if ( process.exitCode !== 0 ) {
		return;
	}

	console.log( chalk.green( 'Checking for filename collisions. Just a sec...' ) );

	const compare = Intl.Collator( 'und', { sensitivity: 'accent' } ).compare;

	const files = (
		await spawnAndReadStdout( 'git', [
			'-c',
			'core.quotepath=off',
			'ls-tree',
			'-rt',
			'--name-only',
			'HEAD',
		] )
	).sort( compare );

	const collisions = new Set();
	let prev = null;
	for ( const file of files ) {
		if ( prev !== null && compare( file, prev ) === 0 ) {
			collisions.add( prev );
			collisions.add( file );
		}
		prev = file;
	}

	if ( collisions.size > 0 ) {
		process.exitCode = 1;
		console.error(
			chalk.red(
				'This commit contains filenames that differ only in case! This will break things for Mac users.'
			)
		);
		console.error( '- ' + [ ...collisions ].join( '\n- ' ) );
	} else {
		console.log( chalk.green( 'No collisions detected.' ) );
	}
}

process.exitCode = 0;
await checkFilenameCollisions();
