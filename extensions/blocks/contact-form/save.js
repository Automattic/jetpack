/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Save( { attributes } ) {
	const { url } = attributes;
	return <a href={ url }>{ __( 'Submit a contact form.', 'jetpack' ) }</a>;
}
