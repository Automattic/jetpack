#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const spawnSync = require( 'child_process' ).spawnSync;
const requirelist = require( './phpcs-requirelist' );

console.log( 'Running PHPCBF. Please standby as it makes code beautiful.' );
spawnSync( 'vendor/bin/phpcbf', [ '-p', ...requirelist ], {
	shell: true,
	stdio: 'inherit',
} );

console.log( 'Running PHPCS.' );

spawnSync( 'vendor/bin/phpcs', [ '-ps', ...requirelist ], {
	shell: true,
	stdio: 'inherit',
} );

process.exit();
