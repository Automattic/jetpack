#!/usr/bin/env node

/**
 * Fail the build if the Connectors card's script module is built in a shape the PHP can't load.
 */

const { validateConnectorsCard } = require( './validate-connectors-card-lib.js' );

const errors = validateConnectorsCard();

if ( errors.length > 0 ) {
	throw new Error(
		'Connectors card build check failed:\n' + errors.map( error => ` - ${ error }` ).join( '\n' )
	);
}
