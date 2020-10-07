#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const requirelist = require( './phpcs-requirelist' );

requirelist.forEach( function ( fileToProcess ) {
	if ( 'docker/' === fileToProcess ) {
		console.log( chalk.yellow( 'Skipping docker/. It takes forever.' ) );
		return;
	}
	console.log( chalk.yellow( 'Processing ' + fileToProcess ) );
	spawnSync( 'vendor/bin/phpcbf', [ fileToProcess ], {
		shell: true,
		stdio: 'inherit',
	} );

	spawnSync( 'composer', [ 'php:lint:errors', fileToProcess ], {
		shell: true,
		stdio: 'inherit',
	} );
} );

process.exit();
