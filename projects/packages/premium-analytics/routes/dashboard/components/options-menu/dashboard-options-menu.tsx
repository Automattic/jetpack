/**
 * WordPress dependencies
 */
import { Icon, IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { comment, moreVertical } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { FeedbackModal } from '../feedback/feedback-modal';

/**
 * The page options menu beside the dashboard's own actions: what the reader can do
 * on this page that is not a layout change. Feedback is its only entry today.
 *
 * `WidgetDashboard.Actions` takes no items, so these cannot join its overflow menu (WOOA7S-2055).
 *
 * @return The menu, and the feedback modal while it is open.
 */
export function DashboardOptionsMenu() {
	const trackEvent = useTrackEvent();
	const [ isFeedbackOpen, setIsFeedbackOpen ] = useState( false );

	const openFeedback = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open' );
		setIsFeedbackOpen( true );
	}, [ trackEvent ] );

	const closeFeedback = useCallback( () => setIsFeedbackOpen( false ), [] );

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Page options', 'jetpack-premium-analytics-pkg' ) }
							variant="minimal"
							tone="brand"
							size="compact"
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<Menu.Item prefix={ <Icon icon={ comment } /> } onClick={ openFeedback }>
						<Menu.ItemLabel>
							{ __( 'Any feedback?', 'jetpack-premium-analytics-pkg' ) }
						</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			{ isFeedbackOpen && <FeedbackModal onClose={ closeFeedback } /> }
		</>
	);
}
