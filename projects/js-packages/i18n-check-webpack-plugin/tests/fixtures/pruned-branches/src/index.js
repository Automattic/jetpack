const { __, _x } = require( '@wordpress/i18n' );

let msg, msg2, msg3;
if ( process.env.NODE_ENV === 'production' ) {
	msg = __( 'This is production', 'domain' );
} else {
	msg = __( 'This is not production', 'domain' );
	msg2 = _x( 'something', 'Something in development', 'domain' );
	msg3 = __( 'another thing', 'domain' );
}

module.exports = {
	msg,
	msg2,
	strings: [ 'something', 'another thing' ],
};
