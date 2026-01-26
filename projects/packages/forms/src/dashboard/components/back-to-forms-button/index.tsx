/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { PARTIAL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';

/**
 * Primary action to return to the Forms list.
 *
 * @return {JSX.Element} Button component.
 */
export default function BackToFormsButton(): JSX.Element {
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );
	// Avoid conditional translation calls: define strings unconditionally, then select.
	const backToFormsLabel = __( 'Back to forms', 'jetpack-forms' );
	const viewAllResponsesLabel = __( 'View all responses', 'jetpack-forms' );
	const label = isCentralFormManagementEnabled === true ? backToFormsLabel : viewAllResponsesLabel;

	const onClick = useCallback( () => {
		// Go to the base Forms dashboard URL (no hash). This will land on:
		// - Forms list when CFM is enabled
		// - All Responses when CFM is disabled
		window.location.href = PARTIAL_RESPONSES_PATH;
	}, [] );

	return (
		<Button size="compact" variant="primary" onClick={ onClick }>
			{ label }
		</Button>
	);
}
