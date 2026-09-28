/**
 * External dependencies
 */
import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { Icon, IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { cancelCircleFilled, cog, comment, moreVertical, pencil } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { FeedbackModal } from './feedback-modal';
import { SettingsDrawer } from './settings-drawer';
import { SwitchOffDialog } from './switch-off-dialog';

// `?settings=1` in the route's search opens the settings, so other screens can link straight to them.
const SETTINGS_SEARCH_PARAM = 'settings';

const dropSettingsParam = ( search: Record< string, unknown > ) => {
	const rest = { ...search };
	delete rest[ SETTINGS_SEARCH_PARAM ];
	return rest;
};

export type PageOptionsMenuProps = {
	/** Enters customize mode; Customize is on offer only when given. */
	onCustomize?: () => void;
};

/**
 * The page options menu of a Premium Analytics page: arranging the layout, where
 * the page has one, and, apart from it, the Stats settings, feedback and the way
 * back to classic Stats. After the configurations design (WOOA7S-2055) less its
 * Usage entry.
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
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	const navigate = useNavigate();
	const isSettingsRequested = search[ SETTINGS_SEARCH_PARAM ] !== undefined;
	const [ isSettingsOpen, setIsSettingsOpen ] = useState( isSettingsRequested );

	// The opt-in and the Stats settings are site settings, so changing them takes the same capability.
	const canManageSettings = currentUserCan( 'manage_options' );
	// Simple sites have no local Stats settings route.
	const offersSettings = canManageSettings && ! isSimpleSite();

	const openFeedback = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open', { source: 'menu' } );
		setIsFeedbackOpen( true );
	}, [ trackEvent ] );

	const closeFeedback = useCallback( () => setIsFeedbackOpen( false ), [] );
	const openSwitchOff = useCallback( () => setIsSwitchOffOpen( true ), [] );
	const closeSwitchOff = useCallback( () => setIsSwitchOffOpen( false ), [] );
	const openSettings = useCallback( () => setIsSettingsOpen( true ), [] );
	const closeSettings = useCallback( () => {
		setIsSettingsOpen( false );
		// A reload or Back would open the drawer again while the param stays.
		if ( isSettingsRequested ) {
			navigate( {
				replace: true,
				// Without a route to read it from, TanStack types the reducer's result as `never`.
				search: dropSettingsParam as never,
			} );
		}
	}, [ isSettingsRequested, navigate ] );

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
					{ offersSettings && (
						<Menu.Item prefix={ <Icon icon={ cog } /> } onClick={ openSettings }>
							<Menu.ItemLabel>{ __( 'Settings', 'jetpack-premium-analytics-pkg' ) }</Menu.ItemLabel>
						</Menu.Item>
					) }
					<Menu.Item prefix={ <Icon icon={ comment } /> } onClick={ openFeedback }>
						<Menu.ItemLabel>
							{ __( 'Any feedback?', 'jetpack-premium-analytics-pkg' ) }
						</Menu.ItemLabel>
					</Menu.Item>
					{ canManageSettings && (
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
			{ offersSettings && <SettingsDrawer open={ isSettingsOpen } onClose={ closeSettings } /> }
		</>
	);
}
