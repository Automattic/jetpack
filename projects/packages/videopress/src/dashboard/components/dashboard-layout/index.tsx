/**
 * External dependencies
 */
import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { useSettledFirstRunState } from '../../hooks/use-first-run-state';
import DashboardTabs, {
	CANONICAL_TAB_ORDER,
	TAB_PATHS,
	useDashboardTabOrder,
	type DashboardTab,
} from '../dashboard-tabs';
import OnboardingModal from '../onboarding-modal';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	activeTab: DashboardTab;
	children: ReactNode;
	actions?: ReactNode;
	hideFooter?: boolean;
};

let hasHandledLandingRedirect = false;

/**
 * Shared chrome for every wp-build VideoPress dashboard tab. Renders
 * `AdminPage` (with header + JetpackFooter) and a `Tabs.Root` containing
 * the strip and one `Tabs.Panel` per tab so the `@wordpress/ui` Tabs
 * Tab/Panel pairing validator stays happy. Tab navigation between
 * sibling routes happens via `@wordpress/route`'s useNavigate.
 *
 * @param props            - Component props.
 * @param props.activeTab  - Currently active tab.
 * @param props.children   - Active tab's body content.
 * @param props.actions    - Optional content rendered in the page header's
 *                         top-right actions slot (e.g. a Save button).
 * @param props.hideFooter - When true, suppresses the JetpackFooter rendered by
 *                         AdminPage. Used by DataViews-centric tabs (e.g. Library).
 * @return The wrapped page element.
 */
export default function DashboardLayout( { activeTab, children, actions, hideFooter }: Props ) {
	const navigate = useNavigate();
	const settledFirstRunState = useSettledFirstRunState();
	const tabs = useDashboardTabOrder();
	const hasCheckedLandingRedirect = useRef( false );

	// Panels are rendered by mapping over the tab order, so a route whose tab is
	// not in that order would render its children nowhere — a blank page. This
	// is reachable in normal use: the upload flow's first successful upload
	// flips the state to `home`, which drops `upload` from the order while the
	// user is still standing on /upload finishing the details step. Keep the
	// active tab in the list (in its canonical position) so the body always has
	// a panel to land in, and so every panel still has a paired tab.
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

	// Route the landing tab to whichever screen this user's dashboard is built
	// around: the dropzone on a genuine first run, Home once they have a
	// library. `/` is Library's path, so without this the tab strip leads with
	// Home while the page underneath is always Library — a first tab you can
	// never land on.
	//
	// Fires at most once per page load, so a later, deliberate click on Library
	// is never hijacked. `settledFirstRunState` rather than `firstRunState` is
	// load-bearing: the count reads 0 until its request returns, which is
	// indistinguishable from an empty library, so deciding early would bounce
	// every existing user off Library on every cold load. The one-shot is burnt
	// only once the count is known — otherwise the first (loading) commit
	// consumes it and the real decision never happens.
	useEffect( () => {
		if ( hasHandledLandingRedirect || hasCheckedLandingRedirect.current ) {
			return;
		}

		if ( settledFirstRunState === 'loading' ) {
			return;
		}

		hasHandledLandingRedirect = true;
		hasCheckedLandingRedirect.current = true;

		if ( activeTab !== 'library' ) {
			return;
		}

		navigate( {
			href: settledFirstRunState === 'first-run' ? TAB_PATHS.upload : TAB_PATHS.home,
		} );
	}, [ activeTab, settledFirstRunState, navigate ] );

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
			<Tabs.Root className="vp-dashboard-tabs" value={ activeTab } onValueChange={ onValueChange }>
				<DashboardTabs tabs={ visibleTabs } />
				{ visibleTabs.map( tab => (
					<Tabs.Panel key={ tab } value={ tab }>
						{ activeTab === tab ? children : null }
					</Tabs.Panel>
				) ) }
			</Tabs.Root>
			<OnboardingModal />
		</AdminPage>
	);
}
