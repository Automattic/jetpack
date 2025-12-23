/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useLocation, useNavigate } from 'react-router';

/**
 * Toggle between the responses inbox and reusable forms list.
 *
 * @return {JSX.Element} The toggle component.
 */
export default function ViewToggle() {
	const location = useLocation();
	const navigate = useNavigate();

	const currentPath = location.pathname.replace( /^\//, '' );
	const isFormsView = currentPath.startsWith( 'forms' );

	const goToForms = useCallback( () => navigate( '/forms' ), [ navigate ] );
	const goToResponses = useCallback( () => navigate( '/responses' ), [ navigate ] );

	return (
		<div
			className="jp-forms-view-toggle"
			role="group"
			aria-label={ __( 'Switch dashboard view', 'jetpack-forms' ) }
		>
			<Button isPrimary={ isFormsView } isSecondary={ ! isFormsView } onClick={ goToForms }>
				{ __( 'View Forms', 'jetpack-forms' ) }
			</Button>
			<Button isPrimary={ ! isFormsView } isSecondary={ isFormsView } onClick={ goToResponses }>
				{ __( 'View Responses', 'jetpack-forms' ) }
			</Button>
		</div>
	);
}
