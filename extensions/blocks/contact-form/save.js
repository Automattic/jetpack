/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Save( { attributes } ) {
	const { postUrl } = attributes;
	return <a href={ postUrl }>{ __( 'Submit a contact form.', 'jetpack' ) }</a>;
}
