const browserslist = require( 'browserslist' );
module.exports = browserslist(
	( browserslist.findConfig( '.' ) || {} ).defaults || require( '@wordpress/browserslist-config' )
);
