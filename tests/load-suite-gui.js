var glob = require( 'glob' );

require( 'test/main.js' );

glob.sync( '**/test/component.js' ).forEach( file => {
	require( file.replace( '_inc/client/', '' ) );
});