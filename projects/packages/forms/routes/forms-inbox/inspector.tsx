/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Inspector component for the forms inbox route.
 *
 * @return {JSX.Element | null} The inspector component.
 */
export const inspector = () => {
	return (
		<div style={ { padding: '20px' } }>
			<h2>{ __( 'Inspector', 'jetpack-forms' ) }</h2>
			<p>{ __( 'This is the inspector view placeholder.', 'jetpack-forms' ) }</p>
		</div>
	);
};
