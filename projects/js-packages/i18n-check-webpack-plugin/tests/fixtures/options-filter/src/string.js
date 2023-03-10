const { __ } = require( '@wordpress/i18n' );

function conditionals( x ) {
	return x ? __( 'string is set', 'domain' ) : __( 'string is not set', 'domain' );
}

module.exports = conditionals;
