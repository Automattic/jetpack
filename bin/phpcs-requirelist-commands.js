#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const requirelist = require( './phpcs-requirelist' );

requirelist.forEach( function ( fileToProcess ) {
	if ( 'docker/' === fileToProcess ) {
		console.log( chalk.yellow( 'Skipping docker/. It takes forever.' ) ); // Remove after #17405 is merged.
		return;
	}
	console.log( chalk.yellow( 'Processing ' + fileToProcess ) );
	spawnSync( 'vendor/bin/phpcbf', [ fileToProcess ], {
		shell: true,
		stdio: 'inherit',
	} );
} );

console.log(
	chalk.yellow(
		'PHPCBF completed. Now running PHPCS. Please be patient and thank you for developing Jetpack.'
	)
);

requirelist.forEach( function ( fileToProcess ) {
	if ( 'docker/' === fileToProcess ) {
		console.log( chalk.yellow( 'Skipping docker/. It takes forever.' ) ); // Remove after #17405 is merged.
		return;
	}

	spawnSync( 'vendor/bin/phpcs', [ '-s', fileToProcess ], {
		shell: true,
		stdio: 'inherit',
	} );
} );

process.exit();
