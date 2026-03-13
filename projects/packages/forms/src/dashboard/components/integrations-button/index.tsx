/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router';

/**
 * Renders a button to navigate to the integrations page.
 *
 * @return {JSX.Element} The button to open integrations.
 */
export default function IntegrationsButton(): JSX.Element {
	const navigate = useNavigate();

	const onButtonClickHandler = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_button_click', {
			origin: 'dashboard',
		} );
		navigate( '/integrations' );
	}, [ navigate ] );

	return (
		<Button size="compact" variant="secondary" onClick={ onButtonClickHandler }>
			{ __( 'Manage integrations', 'jetpack-forms' ) }
		</Button>
	);
}
