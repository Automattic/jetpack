/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useLocation, useNavigate } from 'react-router';

/**
 * Renders a button to toggle between Forms list and Responses list.
 *
 * - When on /forms, shows "View responses" and links to /responses
 * - Otherwise, shows "View forms" and links to /forms
 *
 * @return {JSX.Element} The toggle button.
 */
export default function FormsResponsesToggleButton(): JSX.Element {
	const location = useLocation();
	const navigate = useNavigate();

	const isOnForms = location.pathname === '/forms';
	const label = isOnForms
		? __( 'View responses', 'jetpack-forms' )
		: __( 'View forms', 'jetpack-forms' );
	const target = isOnForms ? '/responses' : '/forms';

	const onClick = useCallback( () => {
		navigate( target );
	}, [ navigate, target ] );

	return (
		<Button size="compact" variant="secondary" onClick={ onClick }>
			{ label }
		</Button>
	);
}
