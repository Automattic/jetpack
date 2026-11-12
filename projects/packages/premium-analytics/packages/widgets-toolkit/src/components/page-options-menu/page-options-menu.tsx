/**
 * External dependencies
 */
import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { Icon, IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { cancelCircleFilled, cog, comment, moreVertical, pencil } from '@wordpress/icons';
import { Link as RouteLink, useLinkProps } from '@wordpress/route';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useReportNavigationSearch } from '../../hooks/use-report-navigation-search';
import { useTrackEvent } from '../../hooks/use-track-event';
import { canSendFeedback } from './can-send-feedback';
import { getClassicStatsUrl } from './classic-stats-url';
import { FeedbackModal } from './feedback-modal';
import { SwitchOffDialog } from './switch-off-dialog';

const SETTINGS_PATH = '/settings';

/**
 * The menu's link to the Settings page, with the report window and the tab to return to.
 * Disabled on the Settings page itself.
 *
 * @return The menu item.
 */
function SettingsMenuItem() {
	const search = useReportNavigationSearch();

	// The router marks a link to the page on screen with `data-status`, which the hook's type leaves out.
	const linkProps = useLinkProps( {
		to: SETTINGS_PATH,
		activeOptions: { exact: true, includeSearch: false },
	} ) as Record< string, unknown >;
	const isCurrentPage = linkProps[ 'data-status' ] === 'active';

	const prefix = <Icon icon={ cog } />;
	const label = (
		<Menu.ItemLabel>{ __( 'Settings', 'jetpack-premium-analytics-pkg' ) }</Menu.ItemLabel>
	);

	// A link item takes no disabled state, so the page's own entry is a plain item.
	if ( isCurrentPage ) {
		return (
			<Menu.Item disabled prefix={ prefix }>
				{ label }
			</Menu.Item>
		);
	}

	return (
		<Menu.LinkItem
			prefix={ prefix }
			// Route types cannot resolve here.
			render={ <RouteLink to={ SETTINGS_PATH } search={ search as unknown as never } /> }
		>
			{ label }
		</Menu.LinkItem>
	);
}

type PageOptionsMenuProps = {
	/** Enters customize mode; Customize is on offer only when given. */
	onCustomize?: () => void;
};

/**
 * The page options menu of a Premium Analytics page: arranging the layout, where
 * the page has one, the Settings page and, apart from them, feedback and the way
 * back to classic Stats. After the configurations design (WOOA7S-2055) less its
 * Usage entry.
 *
 * `WidgetDashboard.Actions` takes no items, so these cannot join its overflow menu (WOOA7S-2098).
 *
 * @param {PageOptionsMenuProps} props - The component props.
 * @return The menu, and whichever of its dialogs is open.
 */
export function PageOptionsMenu( { onCustomize }: PageOptionsMenuProps ) {
	const trackEvent = useTrackEvent();
	const [ isFeedbackOpen, setIsFeedbackOpen ] = useState( false );
	const [ isSwitchOffOpen, setIsSwitchOffOpen ] = useState( false );

	// The opt-in is a site setting, so switching it off takes the same capability; and it
	// sends the reader to classic Stats, so there has to be one.
	const canSwitchOff = currentUserCan( 'manage_options' ) && null !== getClassicStatsUrl();
	const canGiveFeedback = canSendFeedback();
	// Present only for users who can manage the settings, on sites where the dashboard owns them.
	const hasSettings = !! getScriptData()?.premium_analytics?.stats_settings;

	const openFeedback = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open', { source: 'menu' } );
		setIsFeedbackOpen( true );
	}, [ trackEvent ] );

	const closeFeedback = useCallback( () => setIsFeedbackOpen( false ), [] );
	const openSwitchOff = useCallback( () => setIsSwitchOffOpen( true ), [] );
	const closeSwitchOff = useCallback( () => setIsSwitchOffOpen( false ), [] );

	if ( ! onCustomize && ! hasSettings && ! canGiveFeedback && ! canSwitchOff ) {
		return null;
	}

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
						<Menu.Item prefix={ <Icon icon={ pencil } /> } onClick={ onCustomize }>
							<Menu.ItemLabel>
								{ __( 'Customize', 'jetpack-premium-analytics-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
					{ onCustomize && hasSettings && <Menu.Separator /> }
					{ hasSettings && <SettingsMenuItem /> }
					{ ( onCustomize || hasSettings ) && ( canGiveFeedback || canSwitchOff ) && (
						<Menu.Separator />
					) }
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
