#!/usr/bin/env node

/**
 * Post-build check: fail the build when a polyfilled package imports a symbol the
 * shipped version of another polyfilled package does not export (the Jetpack 16.0
 * blank-dashboard failure mode). See validate-export-contract-lib.js.
 */

const { validateExportContracts } = require( './validate-export-contract-lib.js' );

const result = validateExportContracts();

if ( ! result.ok ) {
	throw new Error( result.error );
}
