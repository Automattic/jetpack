const { __ } = require( '@wordpress/i18n' );

function conditionals( x ) {
	return x ? __( 'arr is set', 'domain' ) : __( 'arr is not set', 'domain' );
}

module.exports = conditionals;
