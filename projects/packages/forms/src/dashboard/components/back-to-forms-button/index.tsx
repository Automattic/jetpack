/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import { PARTIAL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';

/**
 * Primary action to return to the Forms list.
 *
 * @return {JSX.Element} Button component.
 */
export default function BackToFormsButton(): JSX.Element {
	const onClick = useCallback( () => {
		// Go to the base Forms dashboard URL (no hash). This will land on:
		// - Forms list when CFM is enabled
		// - Responses inbox when CFM is disabled
		window.location.href = PARTIAL_RESPONSES_PATH;
	}, [] );

	return (
		<Button size="compact" variant="primary" onClick={ onClick }>
			{ __( 'Back to forms', 'jetpack-forms' ) }
		</Button>
	);
}
