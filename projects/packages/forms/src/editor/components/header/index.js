/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';
import { DocumentTools } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { DocumentTools } from '../document-tools';

/**
 *
 */
export default function Header() {
	return (
		<div
			className="jetpack-forms-header editor-header edit-post-header"
			role="region"
			aria-label={ __( 'Custom Editor top bar.', 'jetpack-forms' ) }
			tabIndex="-1"
		>
			<DocumentTools />
			<h1 className="jetpack-forms-header__title">{ __( 'Form Editor', 'jetpack-forms' ) }</h1>
		</div>
	);
}
