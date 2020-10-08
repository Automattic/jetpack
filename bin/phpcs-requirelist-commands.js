#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const spawnSync = require( 'child_process' ).spawnSync;
const requirelist = require( './phpcs-requirelist' );

console.log( 'PHPCBF... Please expect this to take minutes.' );
spawnSync( 'vendor/bin/phpcbf', [ ...requirelist ], {
	shell: true,
	stdio: 'inherit',
} );

console.log( 'PHPCS... Please expect this to take minutes.' );

spawnSync( 'vendor/bin/phpcs', [ '-s', ...requirelist ], {
	shell: true,
	stdio: 'inherit',
} );

process.exit();
