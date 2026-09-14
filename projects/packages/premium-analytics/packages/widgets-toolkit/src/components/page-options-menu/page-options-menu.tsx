/**
 * External dependencies
 */
import { currentUserCan } from '@automattic/jetpack-script-data';
import { Icon, IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { cancelCircleFilled, comment, moreVertical, pencil } from '@wordpress/icons';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { FeedbackModal } from './feedback-modal';
import { SwitchOffDialog } from './switch-off-dialog';

export type PageOptionsMenuProps = {
	/** Enters customize mode; Customize is on offer only when given. */
	onCustomize?: () => void;
};

/**
 * The page options menu of a Premium Analytics page: arranging the layout, where
 * the page has one, and, apart from it, feedback and the way back to classic
 * Stats. After the configurations design (WOOA7S-2055) less its Usage and
 * Settings entries.
 *
 * `WidgetDashboard.Actions` takes no items, so these cannot join its overflow menu (WOOA7S-2098).
 *
 * @param props             - Component props.
 * @param props.onCustomize - Enters customize mode; Customize is on offer only when given.
 * @return The menu, and whichever of its dialogs is open.
 */
export function PageOptionsMenu( { onCustomize }: PageOptionsMenuProps ) {
	const trackEvent = useTrackEvent();
	const [ isFeedbackOpen, setIsFeedbackOpen ] = useState( false );
	const [ isSwitchOffOpen, setIsSwitchOffOpen ] = useState( false );

	// The opt-in is a site setting, so switching it off takes the same capability.
	const canSwitchOff = currentUserCan( 'manage_options' );

	const openFeedback = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open' );
		setIsFeedbackOpen( true );
	}, [ trackEvent ] );

	const closeFeedback = useCallback( () => setIsFeedbackOpen( false ), [] );
	const openSwitchOff = useCallback( () => setIsSwitchOffOpen( true ), [] );
	const closeSwitchOff = useCallback( () => setIsSwitchOffOpen( false ), [] );

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
					{ onCustomize && (
						<>
							<Menu.Item prefix={ <Icon icon={ pencil } /> } onClick={ onCustomize }>
								<Menu.ItemLabel>
									{ __( 'Customize', 'jetpack-premium-analytics-pkg' ) }
								</Menu.ItemLabel>
							</Menu.Item>
							<Menu.Separator />
						</>
					) }
					<Menu.Item prefix={ <Icon icon={ comment } /> } onClick={ openFeedback }>
						<Menu.ItemLabel>
							{ __( 'Any feedback?', 'jetpack-premium-analytics-pkg' ) }
						</Menu.ItemLabel>
					</Menu.Item>
					{ canSwitchOff && (
						<Menu.Item prefix={ <Icon icon={ cancelCircleFilled } /> } onClick={ openSwitchOff }>
							<Menu.ItemLabel>
								{ __( 'Switch off the preview', 'jetpack-premium-analytics-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
				</Menu.Popup>
			</Menu.Root>
			{ isFeedbackOpen && <FeedbackModal onClose={ closeFeedback } /> }
			{ isSwitchOffOpen && <SwitchOffDialog onClose={ closeSwitchOff } /> }
		</>
	);
}
