const { __, _x } = require( '@wordpress/i18n' );

function constCombining() {
	const a = 42;

	/* Translators: This comment will be lost */
	const bugged = _x( 'The comment will be lost when the assignment is merged into the above const', 'context', 'domain' );

	const fixed =
		/* Translators: This comment will not be lost */
		_x( 'This is the workaround', 'context', 'domain' );

	return { bugged, fixed };
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
