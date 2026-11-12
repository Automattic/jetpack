/**
 * External dependencies
 */
import { currentUserCan } from '@automattic/jetpack-script-data';
import { Icon, IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { cancelCircleFilled, comment, moreVertical } from '@wordpress/icons';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { canSendFeedback } from './can-send-feedback';
import { getClassicStatsUrl } from './classic-stats-url';
import { FeedbackModal } from './feedback-modal';
import { SwitchOffDialog } from './switch-off-dialog';
import type { Ref } from 'react';

/**
 * The page options menu of a Premium Analytics page: feedback and the way back to classic Stats.
 *
 * `WidgetDashboard.Actions` takes no items, so these cannot join its overflow menu (WOOA7S-2098).
 *
 * @param props            - Component props.
 * @param props.triggerRef - The menu's trigger button.
 * @return The menu, and whichever of its dialogs is open.
 */
export function PageOptionsMenu( { triggerRef }: { triggerRef?: Ref< HTMLButtonElement > } ) {
	const trackEvent = useTrackEvent();
	const [ isFeedbackOpen, setIsFeedbackOpen ] = useState( false );
	const [ isSwitchOffOpen, setIsSwitchOffOpen ] = useState( false );

	// The opt-in is a site setting, so switching it off takes the same capability; and it
	// sends the reader to classic Stats, so there has to be one.
	const canSwitchOff = currentUserCan( 'manage_options' ) && null !== getClassicStatsUrl();
	const canGiveFeedback = canSendFeedback();

	const openFeedback = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open', { source: 'menu' } );
		setIsFeedbackOpen( true );
	}, [ trackEvent ] );

	const closeFeedback = useCallback( () => setIsFeedbackOpen( false ), [] );
	const openSwitchOff = useCallback( () => setIsSwitchOffOpen( true ), [] );
	const closeSwitchOff = useCallback( () => setIsSwitchOffOpen( false ), [] );

	if ( ! canGiveFeedback && ! canSwitchOff ) {
		return null;
	}

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					ref={ triggerRef }
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
					{ canGiveFeedback && (
						<Menu.Item prefix={ <Icon icon={ comment } /> } onClick={ openFeedback }>
							<Menu.ItemLabel>
								{ __( 'Any feedback?', 'jetpack-premium-analytics-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
					{ canSwitchOff && (
						<Menu.Item prefix={ <Icon icon={ cancelCircleFilled } /> } onClick={ openSwitchOff }>
							<Menu.ItemLabel>
								{ __( 'Switch off the preview', 'jetpack-premium-analytics-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
				</Menu.Popup>
			</Menu.Root>
			{ isFeedbackOpen && <FeedbackModal source="menu" onClose={ closeFeedback } /> }
			{ isSwitchOffOpen && <SwitchOffDialog onClose={ closeSwitchOff } /> }
		</>
	);
}
