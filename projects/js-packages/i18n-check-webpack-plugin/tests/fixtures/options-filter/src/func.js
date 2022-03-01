const { __ } = require( '@wordpress/i18n' );

function conditionals( x ) {
	return x ? __( 'func is set', 'domain' ) : __( 'func is not set', 'domain' );
}

module.exports = conditionals;
