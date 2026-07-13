import AdminPage from '@automattic/jetpack-components/admin-page';
import { currentUserCan, getSiteData } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs, Tooltip } from '@wordpress/ui';
import { ModernizationProvider } from '../hooks/use-is-modernized';
import SocialGate from './social-gate';
import useSocialGate from './social-gate/use-social-gate';
// Define the `--color-facebook`, `--color-twitter`, ... custom properties
// that `SocialServiceIcon` (and friends) consume to paint per-service
// brand colours. The legacy `social-admin-page` webpack bundle inlines
// these via `postcss-custom-properties { preserve: false }`; the chassis
// esbuild pipeline doesn't run postcss, so the variables would otherwise
// be undefined and the icons render black on a white surface.
import 'social-logos/colors.css';
import './social-page.scss';
import type { ReactNode } from 'react';

export type SocialTab = 'overview' | 'settings';

type Props = {
	activeTab: SocialTab;
	actions?: ReactNode;
	children: ReactNode;
	/**
	 * Hide the Overview/Settings tab chrome and render `children` on their own.
	 * Used when Social is off: there's nothing to switch between, so the page
	 * collapses to the single turn-on surface.
	 */
	hideTabs?: boolean;
};

const PRODUCT_NAME = 'Social'; /** "Social" is a product name, do not translate. */

const SUBTITLES: Record< SocialTab, () => string > = {
	overview: () =>
		__( 'Connect your social accounts and see what drives traffic.', 'jetpack-publicize-pkg' ),
	settings: () =>
		__( 'Customize how your posts are shared to social media.', 'jetpack-publicize-pkg' ),
};

/**
 * Shared chrome for the unified Social page — owns the `AdminPage` from
 * `@automattic/jetpack-components` plus the Overview / Settings tab nav.
 * `AdminPage` supplies the Jetpack header (logo + title) and footer and the
 * shared `jetpack-admin-page-layout-wp-build` layout (fixed-position content
 * column, scrolling middle, pinned footer); the shell adds the tab bar +
 * content padding via `social-page.scss`. Routes exchange tabs via `?tab=` so
 * the `Tabs.Root` mounts once and the active-tab indicator slides between tabs
 * instead of remounting.
 *
 * @param props           - Component props.
 * @param props.activeTab - Which tab the current route represents.
 * @param props.actions   - Optional actions slot (top-right of the Page header).
 * @param props.children  - `Tabs.Panel` children.
 * @param props.hideTabs  - Hide the tab chrome and render children on their own.
 * @return The unified Social page shell.
 */
export default function SocialPage( {
	activeTab,
	actions,
	children,
	hideTabs = false,
}: Props ): JSX.Element {
	const navigate = useNavigate();

	const { gate, dismissPricing } = useSocialGate();
	const headerActions = gate === null ? actions : null;

	// Both the Settings tab and the Overview stats chart require admin-only
	// capabilities (`manage_options` / stats reads), so non-admins have nothing
	// to switch between — drop the tab chrome entirely and show the lone
	// connection-management surface the Overview route hands us. `hideTabs` does
	// the same when Social is off (single turn-on surface).
	const showTabs = currentUserCan( 'manage_options' ) && ! hideTabs;

	// Keep the route at `/` and toggle tabs via a `?tab=` search param so the
	// `Tabs.Root` mounts once and the active-tab indicator can animate.
	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'overview' && next !== 'settings' ) {
				return;
			}
			navigate( {
				search: {
					tab: next === 'settings' ? 'settings' : undefined,
				},
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	return (
		<ModernizationProvider>
			<Tooltip.Provider delay={ 0 }>
				<AdminPage
					apiRoot={ getSiteData()?.rest_root }
					apiNonce={ getSiteData()?.rest_nonce }
					title={ PRODUCT_NAME }
					subTitle={ SUBTITLES[ activeTab ]() }
					actions={ headerActions }
				>
					<SocialGate gate={ gate } onDismissPricing={ dismissPricing }>
						{ showTabs ? (
							<Tabs.Root
								className="jetpack-social-tabs"
								value={ activeTab }
								onValueChange={ onTabChange }
							>
								<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
									<Tabs.List variant="minimal">
										<Tabs.Tab value="overview">
											{ __( 'Overview', 'jetpack-publicize-pkg' ) }
										</Tabs.Tab>
										<Tabs.Tab value="settings">
											{ __( 'Settings', 'jetpack-publicize-pkg' ) }
										</Tabs.Tab>
									</Tabs.List>
								</div>
								<div className="jetpack-social-page__content jetpack-social-page__content--padded">
									{ children }
								</div>
							</Tabs.Root>
						) : (
							<div className="jetpack-social-page__content jetpack-social-page__content--padded">
								{ children }
							</div>
						) }
					</SocialGate>
				</AdminPage>
			</Tooltip.Provider>
		</ModernizationProvider>
	);
}
