/**
 * External dependencies
 */
import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { getSectionOrder } from '@jetpack-premium-analytics/data';
import { Icon, IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import {
	cancelCircleFilled,
	chevronUpDown,
	cog,
	comment,
	moreVertical,
	pencil,
	rotateLeft,
} from '@wordpress/icons';
import { Link as RouteLink, useLinkProps } from '@wordpress/route';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useDashboardSection } from '../../hooks/use-dashboard-origin-search';
import { useNarrowPageHeader } from '../../hooks/use-narrow-page-header';
import { useReportNavigationSearch } from '../../hooks/use-report-navigation-search';
import { useTrackEvent } from '../../hooks/use-track-event';
import { ResetLayoutDialog } from '../reset-layout/reset-layout-dialog';
import { ArrangeTabsDialog, type ArrangeableTabs } from './arrange-tabs-dialog';
import { canSendFeedback } from './can-send-feedback';
import { getClassicStatsUrl } from './classic-stats-url';
import { FeedbackModal } from './feedback-modal';
import { SwitchOffDialog } from './switch-off-dialog';

const SETTINGS_PATH = '/settings';

/**
 * The menu's link to the Settings page, with the report window and the tab to return to.
 * Disabled on the Settings page itself, and when the caller says the page cannot open.
 *
 * @param {object}  props          - The component props.
 * @param {boolean} props.disabled - Whether the page cannot open from here.
 * @return The menu item.
 */
function SettingsMenuItem( { disabled }: { disabled: boolean } ) {
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

	// A link item takes no disabled state, so the disabled entry is a plain item.
	if ( disabled || isCurrentPage ) {
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

type StatsOptionsMenuProps = {
	/*
	 * Enters customize mode; Customize is on offer only when given.
	 */
	onCustomize?: () => void;

	/*
	 * Resets the layout on show to its default; on offer only when given, and only
	 * on a narrow header (`useNarrowPageHeader`).
	 */
	onReset?: () => void | Promise< void >;

	/*
	 * The page's tabs, for the reader to arrange; on offer only with two or more.
	 */
	tabs?: ArrangeableTabs;

	/*
	 * Whether the site is connected. Settings and feedback need the connection:
	 * without it Settings is disabled and feedback is left out.
	 */
	isSiteConnected?: boolean;
};

/**
 * The Stats options menu of a Premium Analytics page: arranging the layout and the
 * tabs, where the page has them, the Settings page and, apart from them, feedback
 * and the way back to classic Stats. After the configurations design (WOOA7S-2055)
 * less its Usage entry. It also carries Reset to default on a narrow header
 * (`useNarrowPageHeader`).
 *
 * `WidgetDashboard.Actions` takes no items, so these cannot join its overflow menu (WOOA7S-2098).
 *
 * @param {StatsOptionsMenuProps} props - The component props.
 * @return The menu, and whichever of its dialogs is open.
 */
export function StatsOptionsMenu( {
	onCustomize,
	onReset,
	tabs,
	isSiteConnected = true,
}: StatsOptionsMenuProps ) {
	const trackEvent = useTrackEvent();
	const section = useDashboardSection();
	const [ isFeedbackOpen, setIsFeedbackOpen ] = useState( false );
	const [ isSwitchOffOpen, setIsSwitchOffOpen ] = useState( false );
	const [ isArrangingTabs, setIsArrangingTabs ] = useState( false );
	const [ isResetting, setIsResetting ] = useState( false );
	const isNarrow = useNarrowPageHeader();
	const canArrangeTabs = !! tabs && tabs.items.length > 1;
	const canReset = !! onReset && isNarrow;

	// The opt-in is a site setting, so switching it off takes the same capability; and it
	// sends the reader to classic Stats, so there has to be one.
	const canSwitchOff = currentUserCan( 'manage_options' ) && null !== getClassicStatsUrl();
	const canGiveFeedback = isSiteConnected && canSendFeedback();
	// Present only for users who can manage the settings, on sites where the dashboard owns them.
	const hasSettings = !! getScriptData()?.premium_analytics?.stats_settings;

	const openFeedback = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_open', { source: 'menu' } );
		setIsFeedbackOpen( true );
	}, [ trackEvent ] );

	const closeFeedback = useCallback( () => setIsFeedbackOpen( false ), [] );
	const openSwitchOff = useCallback( () => setIsSwitchOffOpen( true ), [] );
	const closeSwitchOff = useCallback( () => setIsSwitchOffOpen( false ), [] );
	const openArrangeTabs = useCallback( () => {
		if ( tabs ) {
			trackEvent( 'jetpack_premium_analytics_arrange_tabs_open', {
				...( section ? { section } : {} ),
				tab_count: tabs.items.length,
				has_custom_order: getSectionOrder( tabs.scope ).length > 0,
			} );
		}
		setIsArrangingTabs( true );
	}, [ section, tabs, trackEvent ] );
	const closeArrangeTabs = useCallback( () => setIsArrangingTabs( false ), [] );
	const openReset = useCallback( () => setIsResetting( true ), [] );
	const closeReset = useCallback( () => setIsResetting( false ), [] );

	if (
		! onCustomize &&
		! canReset &&
		! canArrangeTabs &&
		! hasSettings &&
		! canGiveFeedback &&
		! canSwitchOff
	) {
		return null;
	}

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Stats options', 'jetpack-premium-analytics-pkg' ) }
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
					{ canReset && (
						<Menu.Item prefix={ <Icon icon={ rotateLeft } /> } onClick={ openReset }>
							<Menu.ItemLabel>
								{ __( 'Reset to default…', 'jetpack-premium-analytics-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
					{ canArrangeTabs && (
						<Menu.Item prefix={ <Icon icon={ chevronUpDown } /> } onClick={ openArrangeTabs }>
							<Menu.ItemLabel>
								{ __( 'Arrange tabs', 'jetpack-premium-analytics-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
					{ ( onCustomize || canReset || canArrangeTabs ) && hasSettings && <Menu.Separator /> }
					{ hasSettings && <SettingsMenuItem disabled={ ! isSiteConnected } /> }
					{ ( onCustomize || canReset || canArrangeTabs || hasSettings ) &&
						( canGiveFeedback || canSwitchOff ) && <Menu.Separator /> }
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
			{ isResetting && onReset && (
				<ResetLayoutDialog onConfirm={ onReset } onClose={ closeReset } />
			) }
			{ isFeedbackOpen && <FeedbackModal source="menu" onClose={ closeFeedback } /> }
			{ isSwitchOffOpen && <SwitchOffDialog onClose={ closeSwitchOff } /> }
			{ isArrangingTabs && tabs && <ArrangeTabsDialog { ...tabs } onClose={ closeArrangeTabs } /> }
		</>
	);
}
