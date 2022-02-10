const { __ } = require( '@wordpress/i18n' );

function conditionals( x ) {
	return x ? __( 'regex is set', 'domain' ) : __( 'regex is not set', 'domain' );
}

module.exports = conditionals;
