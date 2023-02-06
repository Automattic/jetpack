const { __ } = require( '@wordpress/i18n' );

function conditionals( x ) {
	return x ? __( 'X is set', 'domain' ) : __( 'X is not set', 'domain' );
}

module.exports = conditionals;
