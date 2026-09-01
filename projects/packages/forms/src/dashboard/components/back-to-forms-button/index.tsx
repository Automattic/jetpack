/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';

/**
 * Primary action to return to the Forms list.
 *
 * @return {JSX.Element} Button component.
 */
export default function BackToFormsButton(): JSX.Element {
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );
	const navigate = useNavigate();
	// Avoid conditional translation calls: define strings unconditionally, then select.
	const backToFormsLabel = __( 'Back to forms', 'jetpack-forms' );
	const viewAllResponsesLabel = __( 'View all responses', 'jetpack-forms' );
	const label = isCentralFormManagementEnabled === true ? backToFormsLabel : viewAllResponsesLabel;

	const onClick = useCallback( () => {
		// Use the dashboard router (no full page reload).
		navigate( isCentralFormManagementEnabled === true ? '/forms' : '/responses' );
	}, [ isCentralFormManagementEnabled, navigate ] );

	return (
		<Button size="compact" variant="primary" onClick={ onClick }>
			{ label }
		</Button>
	);
}
