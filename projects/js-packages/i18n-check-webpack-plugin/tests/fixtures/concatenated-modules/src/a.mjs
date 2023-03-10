import { __ } from '@wordpress/i18n';

export default function comments( x ) {
	/* Translators: A */
	const a = __( 'A', 'domain' );
	/* Translators: B */
	const b = __( 'B', 'domain' );

	return a + x + b;
}
