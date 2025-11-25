import { Button } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useLocation, useNavigate } from 'react-router';

/**
 * Header button to toggle between Forms list and Responses inbox.
 *
 * The label and target route depend on the current location.
 *
 * @return {JSX.Element} Toggle button component.
 */
export default function FormsViewToggleButton(): JSX.Element {
	const location = useLocation();
	const navigate = useNavigate();

	const { label, target } = useMemo( () => {
		const isFormsRoute = location.pathname === '/forms';

		return isFormsRoute
			? {
					label: __( 'View responses', 'jetpack-forms' ),
					target: '/responses',
			  }
			: {
					label: __( 'View forms', 'jetpack-forms' ),
					target: '/forms',
			  };
	}, [ location.pathname ] );

	const handleClick = useCallback( () => {
		navigate( target );
	}, [ navigate, target ] );

	return (
		<Button size="compact" variant="primary" onClick={ handleClick }>
			{ label }
		</Button>
	);
}
