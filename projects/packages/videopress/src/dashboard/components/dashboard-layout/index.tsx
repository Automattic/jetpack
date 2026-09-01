/**
 * External dependencies
 */
import AdminPage from '@automattic/jetpack-components/admin-page';
import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack, Tabs } from '@wordpress/ui';
import { useSettledFirstRunState } from '../../hooks/use-first-run-state';
import DashboardTabs, {
	CANONICAL_TAB_ORDER,
	TAB_PATHS,
	useDashboardTabOrder,
	type DashboardTab,
} from '../dashboard-tabs';
import OnboardingModal from '../onboarding-modal';
import UploadPill from '../upload-pill';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	activeTab: DashboardTab;
	children: ReactNode;
	actions?: ReactNode;
	hideFooter?: boolean;
	uploadPillSuppressContext?: string;
};

/**
 * Shared chrome for every wp-build VideoPress dashboard tab. Renders
 * `AdminPage` (with header + JetpackFooter) and a `Tabs.Root` containing
 * the strip and one `Tabs.Panel` per tab so the `@wordpress/ui` Tabs
 * Tab/Panel pairing validator stays happy. Tab navigation between
 * sibling routes happens via `@wordpress/route`'s useNavigate.
 *
 * The Library owns `/`, so a bare `admin.php?page=jetpack-videopress` lands
 * on the Library tab directly — there is no landing redirect. On a first run
 * the Library's empty state is the upload flow, so the landing tab and the
 * one job a new user has coincide.
 *
 * @param props                           - Component props.
 * @param props.activeTab                 - Currently active tab.
 * @param props.children                  - Active tab's body content.
 * @param props.actions                   - Optional content rendered in the page header's
 *                                        top-right actions slot (e.g. a Save button).
 * @param props.hideFooter                - When true, suppresses the JetpackFooter rendered by
 *                                        AdminPage. Used by DataViews-centric tabs (e.g. Library).
 * @param props.uploadPillSuppressContext - Queue-item context tag whose uploads
 *                                        already have a progress surface on this screen; the
 *                                        upload pill stands down while the queue holds only
 *                                        those. Passed by the Library's onboarding empty
 *                                        state — see UploadPill.
 * @return The wrapped page element.
 */
export default function DashboardLayout( {
	activeTab,
	children,
	actions,
	hideFooter,
	uploadPillSuppressContext,
}: Props ) {
	const navigate = useNavigate();
	const { hasConnectionError } = useConnectionErrorNotice();
	const settledFirstRunState = useSettledFirstRunState();
	const liveTabs = useDashboardTabOrder();

	// The tab order is frozen for this mount as soon as the count is known.
	// It is derived from the first-run state, and the first successful upload
	// flips that mid-session: the strip would then re-order under the user's
	// cursor while they are still finishing the flow that caused it. The next
	// navigation mounts fresh and picks up the new order.
	//
	// Only the SETTLED state freezes: before it, the optimistic order renders
	// live (a loading count reads as first-run) so a brand-new user never sees
	// the returning-user strip, and freezing the guess would make that
	// permanent for the mount.
	const frozenTabsRef = useRef< DashboardTab[] | null >( null );
	if ( frozenTabsRef.current === null && settledFirstRunState !== 'loading' ) {
		frozenTabsRef.current = liveTabs;
	}
	const tabs = frozenTabsRef.current ?? liveTabs;

	// Panels are rendered by mapping over the tab order, so a route whose tab is
	// not in that order would render its children nowhere — a blank page. This
	// is reachable in normal use: a first-run order carries no Home tab, but a
	// deep link to /home still mounts that route. Keep the active tab in the
	// list (in its canonical position) so the body always has a panel to land
	// in, and so every panel still has a paired tab.
	const visibleTabs = useMemo(
		() =>
			tabs.includes( activeTab )
				? tabs
				: CANONICAL_TAB_ORDER.filter( tab => tab === activeTab || tabs.includes( tab ) ),
		[ activeTab, tabs ]
	);

	const onValueChange = useCallback(
		( next: string ) => {
			const target = TAB_PATHS[ next as DashboardTab ];
			if ( target ) {
				navigate( { href: target } );
			}
		},
		[ navigate ]
	);

	return (
		<AdminPage
			title={ 'VideoPress' /* product name; not translated */ }
			subTitle={ __(
				'Host, manage, customize, and track your videos — all in one place.',
				'jetpack-videopress-pkg'
			) }
			actions={ actions }
			showFooter={ ! hideFooter }
		>
			{ hasConnectionError && (
				<Stack direction="column">
					<ConnectionError />
				</Stack>
			) }
			<Tabs.Root className="vp-dashboard-tabs" value={ activeTab } onValueChange={ onValueChange }>
				<DashboardTabs tabs={ visibleTabs } />
				{ visibleTabs.map( tab => (
					<Tabs.Panel key={ tab } value={ tab }>
						{ activeTab === tab ? children : null }
					</Tabs.Panel>
				) ) }
			</Tabs.Root>
			<OnboardingModal />
			<UploadPill suppressContext={ uploadPillSuppressContext } />
		</AdminPage>
	);
}
