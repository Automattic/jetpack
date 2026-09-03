/**
 * WordPress dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { FeedbackModal } from './feedback-modal';

/**
 * Opt-in entry point for dashboard feedback, sitting beside the dashboard's own actions.
 *
 * It belongs in the actions menu next to Customize, but `WidgetDashboard.Actions`
 * takes no items yet (WOOA7S-2055).
 *
 * @return The trigger, and the modal while it is open.
 */
export function FeedbackAction() {
	const trackEvent = useTrackEvent();
	const [ isOpen, setIsOpen ] = useState( false );

	const open = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open' );
		setIsOpen( true );
	}, [ trackEvent ] );

	const close = useCallback( () => setIsOpen( false ), [] );

	return (
		<>
			<Button variant="minimal" size="compact" onClick={ open }>
				{ __( 'Any feedback?', 'jetpack-premium-analytics-pkg' ) }
			</Button>
			{ isOpen && <FeedbackModal onClose={ close } /> }
		</>
	);
}
