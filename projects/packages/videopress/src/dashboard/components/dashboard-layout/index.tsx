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

/*
 * The landing redirect must fire at most once per PAGE LOAD — but a module
 * variable can't guarantee that here: every route ships as its own bundle
 * with its own copy of this module, so "module-level once" is really "once
 * per route bundle". Concretely: land on Home (its copy burns), click
 * Library, and Library's fresh copy fires the "landing" redirect again,
 * bouncing straight back to Home. A window-scoped flag is shared by all
 * bundle copies, restoring the real once-per-load semantics.
 */
const LANDING_REDIRECT_FLAG = '__jetpackVideoPressLandingRedirectDone';

type FlagWindow = Window & { [ LANDING_REDIRECT_FLAG ]?: boolean };

const hasHandledLandingRedirect = (): boolean =>
	typeof window !== 'undefined' && Boolean( ( window as FlagWindow )[ LANDING_REDIRECT_FLAG ] );

const markLandingRedirectHandled = (): void => {
	if ( typeof window !== 'undefined' ) {
		( window as FlagWindow )[ LANDING_REDIRECT_FLAG ] = true;
	}
};

/**
 * Whether this page load is a genuine landing rather than an in-app arrival.
 *
 * Inside wp-admin the app's path travels in the raw `p` query param (see the
 * note in routes/library/stage.tsx), so every in-app navigation, every
 * deep link, and every reload of one writes a `p`. A landing is exactly
 * `admin.php?page=jetpack-videopress` with none — which is the only case the
 * redirect below is allowed to hijack.
 *
 * @return True when the URL carries no app path of its own.
 */
const isBareLanding = (): boolean =>
	typeof window !== 'undefined' && ! new URLSearchParams( window.location.search ).has( 'p' );

// Stable identity for the "no tabs yet" case, so holding the strip back does
// not hand `Tabs.Root` a fresh array on every render.
const NO_TABS: DashboardTab[] = [];

/**
 * Shared chrome for every wp-build VideoPress dashboard tab. Renders
 * `AdminPage` (with header + JetpackFooter) and a `Tabs.Root` containing
 * the strip and one `Tabs.Panel` per tab so the `@wordpress/ui` Tabs
 * Tab/Panel pairing validator stays happy. Tab navigation between
 * sibling routes happens via `@wordpress/route`'s useNavigate.
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
 *                                        those. Passed by the /upload stage — see UploadPill.
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
	const settledFirstRunState = useSettledFirstRunState();
	const liveTabs = useDashboardTabOrder();
	const hasCheckedLandingRedirect = useRef( false );

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
		if ( hasHandledLandingRedirect() || hasCheckedLandingRedirect.current ) {
			return;
		}

		if ( settledFirstRunState === 'loading' ) {
			return;
		}

		markLandingRedirectHandled();
		hasCheckedLandingRedirect.current = true;

		if ( activeTab !== 'library' || ! isBareLanding() ) {
			return;
		}

		navigate( {
			href: settledFirstRunState === 'first-run' ? TAB_PATHS.upload : TAB_PATHS.home,
		} );
	}, [ activeTab, settledFirstRunState, navigate ] );

	// A bare `admin.php?page=jetpack-videopress` (the WordPress menu link)
	// resolves to the Library route, because Library owns `/`. The effect
	// above then sends the user to Home or Upload — so the Library paints
	// first and is yanked away a moment later, which reads as the page
	// loading twice. Hold the page back until the decision is made: only on
	// that bare landing, and only while the count is still unknown, so a
	// failed count still ends up rendering something rather than hanging on
	// an empty frame.
	const isAwaitingLandingDecision =
		activeTab === 'library' &&
		isBareLanding() &&
		settledFirstRunState === 'loading' &&
		! hasHandledLandingRedirect();

	// The strip is held back over exactly the same window as the body, and for
	// the same reason. Its order comes from the OPTIMISTIC first-run state (a
	// loading count reads as first-run), which is right everywhere else — but on
	// this one URL it meant a returning user watched `Upload | Library | ...`
	// paint with Library active, then the first tab rename itself to Home once
	// the count landed. Leading with the returning order instead would only move
	// that flash onto the brand-new user, which is the whole trade the optimism
	// exists to avoid; on a bare landing neither order is knowably right, so
	// neither is shown. It costs nothing visually — the body under it is blank
	// over the same window, so strip and content arrive in one paint — and the
	// freeze above is untouched, because it reads `liveTabs`, not this.
	//
	// Tabs and panels move together: `@wordpress/ui` validates their pairing, so
	// panels may not outlive the tabs that label them.
	const renderedTabs = isAwaitingLandingDecision ? NO_TABS : visibleTabs;

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
				<DashboardTabs tabs={ renderedTabs } />
				{ renderedTabs.map( tab => (
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
