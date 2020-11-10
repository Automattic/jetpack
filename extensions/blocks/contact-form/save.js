/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Save( { attributes } ) {
	const { postUrl, postLinkText } = attributes;
	return <a href={ postUrl }>{ postLinkText }</a>;
}
