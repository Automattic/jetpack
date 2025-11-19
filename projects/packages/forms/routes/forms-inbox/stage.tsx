/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Stage component for the forms inbox route.
 *
 * @return {JSX.Element} The stage component.
 */
export const stage = () => {
	return (
		<div style={ { padding: '20px' } }>
			<h1>{ __( 'Forms Inbox', 'jetpack-forms' ) }</h1>
			<p>{ __( 'This is the stage view placeholder.', 'jetpack-forms' ) }</p>
		</div>
	);
};
