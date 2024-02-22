const { __, _x } = require( '@wordpress/i18n' );

function constCombining() {
	const a = 42;

	/* Translators: This comment will be lost */
	const bugged = _x( 'The comment will be lost when the assignment is merged into the above const', 'context', 'domain' );

	const fixed =
		/* Translators: This comment will not be lost */
		_x( 'This is the workaround', 'context', 'domain' );

	const bugged2 =
		_x(
			/* Translators: This comment will be in the source but not detected for the right message. */
			'This is another workaround', 'context', 'domain'
		);

	const bugged3 = __( 'This will get the above comment', 'domain' );

	return { bugged, fixed, bugged2, bugged3 };
}

function conditionals( foo, bar ) {
	return {
		bugged: foo ? __( 'Foo is set', 'domain' ) : __( 'Foo is not set', 'domain' ),
		fixed: bar ? __( 'Bar is set', 'domain' ) : __( 'Bar is not set', 'domain', 0 ),
	};
}

module.exports = {
	constCombining,
	conditionals,
};
