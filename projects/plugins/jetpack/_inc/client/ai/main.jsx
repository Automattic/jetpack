/**
 * Root component for the Jetpack AI admin page.
 *
 * Up to four top-level tabs (Overview | Discover | Settings | Scheduled tasks)
 * with hash-based routing. Settings keeps the view key it had as MCP and
 * Connectors, `mcp`, so its links and Tracks props stay as they were. It holds
 * every setting the hub has: the connect card, MCP access with its mcp/read |
 * mcp/write | mcp/setup sub-views and, below that, the AI features section
 * (the per-feature toggles, once a tab of their own). Discover opens
 * each skill in boot's side panel (see discover/skill-panel-state.js), so the
 * tab bar stays the only navigation it needs. Sub-views render with breadcrumbs in
 * place of the page title while keeping the tab bar — with the owning tab
 * selected, since the first path segment names it — so top-level navigation
 * is always available.
 *
 * Overview and the AI features section share a host-controlled gate.
 * Scheduled tasks and Discover are controlled independently by the
 * ai-hub-scheduled-tasks and ai-hub-discover server-side feature flags.
 * Without any of them the page keeps its original MCP-only shape, with the
 * Settings hub as the landing view and no tab bar.
 */

import { AdminPage, JitmSlot } from '@automattic/jetpack-components';
import { useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, Icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Badge, Notice, Stack, Tabs, Text } from '@wordpress/ui';
import ChunkErrorBoundary from './components/chunk-error-boundary/index';
import LoadingSpinner from './components/loading-spinner/index';
import PageNotice, { getPageNoticeState, isConnectionNoticeState } from './components/page-notice';
import { GATED_VIEWS } from './constants';
import Discover from './discover';
import {
	IN_APP_HISTORY_KEY,
	closeSkillPanel,
	getPanelSkill,
	getSkillParam,
	getViewHref,
	openSkillPanel,
	useOpenSkillSlug,
} from './discover/skill-panel-state';
import { getStickyHeight } from './discover/use-toolbar-offset';
import AiFeatures from './features/index';
import { useFeatureSettings } from './features/use-feature-settings';
import { splitViewAnchor } from './mcp/anchors';
import McpConnectAgents from './mcp/connect-agents';
import McpConnectCallout from './mcp/connect-callout';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import { recordMcpTracksEvent } from './mcp/tracks';
import McpUpsell from './mcp/upsell';
import { useMcpSettings } from './mcp/use-mcp-settings';
import useSiteAbilities from './mcp/use-site-abilities';
import { getSiteLevelEnabled } from './mcp/utils';
import McpWrite from './mcp/write';
import AiOverview from './overview';
import { EVENTS, recordAiHubEvent } from './tracks';

// Split into its own chunk: only this tab uses DataViews and the AI client.
const ScheduledTasks = lazy(
	() => import( /* webpackChunkName: "jetpack-ai-scheduled-tasks" */ './scheduled-tasks/index' )
);

// Matches the `ref` value convention used by the MCP upsell events.
const SETTINGS_REF = 'jetpack-ai-mcp-settings';

// Sub-views are nested under their owning tab's path segment, so the active
// tab is always the first segment of the view key.
const MCP_SUB_VIEWS = [ 'mcp/read', 'mcp/write', 'mcp/setup' ];
const ANCHOR_VIEWS = [ 'mcp/read', 'mcp/write' ];

// Skills had pages of their own at discover/<slug> before they opened in the
// side panel; an old link lands on Discover with that skill's panel open.
const DISCOVER_SKILL_PREFIX = 'discover/';

const isDiscoverEnabled = () => !! window?.jetpackAiSettings?.featureFlags?.[ 'ai-hub-discover' ];

// The skill an old discover/<slug> hash names, when this site can run it.
const getLegacySkill = raw =>
	raw.startsWith( DISCOVER_SKILL_PREFIX )
		? getPanelSkill( raw.slice( DISCOVER_SKILL_PREFIX.length ) )
		: undefined;

// The sub-views shipped as flat top-level hashes (#/setup) before they were
// nested; keep old bookmarks and external links working. AI Features was a
// tab of its own before it became a section of the Settings view, and
// #/settings is the tab's own name, so a link spelled that way lands there too.
const LEGACY_VIEW_ALIASES = {
	read: 'mcp/read',
	write: 'mcp/write',
	setup: 'mcp/setup',
	features: 'mcp',
	// The Discover tab is named Skills; its view key stays.
	skills: 'discover',
	settings: 'mcp',
};

// The AI features section's anchor: an old #/features link scrolls to it,
// then moves focus to its heading.
const AI_FEATURES_SECTION_ID = 'jetpack-ai-features';
const AI_FEATURES_TITLE_ID = `${ AI_FEATURES_SECTION_ID }-title`;

// The page marks the history entries it pushes itself (IN_APP_HISTORY_KEY). An
// entry carrying it always has an in-app entry behind it, so the breadcrumb can
// go back without leaving wp-admin; a sub-view opened straight from a link has
// no such entry.
const hasInAppHistory = () => !! window.history.state?.[ IN_APP_HISTORY_KEY ];

const getRawHash = () => window.location.hash.replace( /^#\//, '' );

const isFeaturesHash = () => getRawHash() === 'features';

// Read at call time, not module scope, so the flag reflects the injected page data.
const getTabViews = () => {
	const views = [];
	if ( window?.jetpackAiSettings?.showFeaturesView ) {
		views.push( ...GATED_VIEWS );
	}
	if ( isDiscoverEnabled() ) {
		views.push( 'discover' );
	}
	views.push( 'mcp' );
	if ( window?.jetpackAiSettings?.featureFlags?.[ 'ai-hub-scheduled-tasks' ] ) {
		views.push( 'scheduled-tasks' );
	}
	return views;
};

// The default is Overview when visible (matching the design), otherwise the
// Settings hub — never Discover, even when it leads the tab bar. A hash pointing
// at a hidden view falls back too. The MCP Read and Write views also take a
// trailing tool anchor (`#/mcp/read/<anchor>`).
const getRouteFromHash = () => {
	const raw = getRawHash();
	if ( getLegacySkill( raw ) ) {
		return { view: 'discover', anchor: null };
	}
	const tabViews = getTabViews();
	const { view, anchor } = splitViewAnchor(
		LEGACY_VIEW_ALIASES[ raw ] ?? raw,
		[ ...tabViews, ...MCP_SUB_VIEWS ],
		ANCHOR_VIEWS
	);
	return { view: view ?? ( tabViews.includes( 'overview' ) ? 'overview' : 'mcp' ), anchor };
};

const VIEW_TITLES = {
	overview: __( 'Overview', 'jetpack' ),
	'scheduled-tasks': __( 'Scheduled tasks', 'jetpack' ),
	mcp: __( 'Settings', 'jetpack' ),
	discover: __( 'Skills', 'jetpack' ),
	'mcp/read': __( 'Read', 'jetpack' ),
	'mcp/write': __( 'Write', 'jetpack' ),
	'mcp/setup': __( 'Connect external AI agent', 'jetpack' ),
};

// The sticky tab strip's height, published on the content column so a control
// scrolled into view on focus stops below the strip (see style.scss).
const TABS_HEIGHT_PROPERTY = '--jetpack-ai-tabs-height';

// The skill panel's root, in boot's inspector beside the hub.
const SKILL_PANEL_SELECTOR = '.jetpack-ai-skill-panel';

const SUB_VIEW_DESCRIPTIONS = {
	'mcp/read': __( 'View your site’s content.', 'jetpack' ),
	'mcp/write': __( 'Create, update, and manage content on your site.', 'jetpack' ),
	'mcp/setup': __( 'Get instructions for connecting your external AI assistant.', 'jetpack' ),
};

/**
 * Keep the panel's URL state in step with the hash: an old discover/<slug>
 * link becomes Discover with that skill's panel open, and a `skill` param that
 * opens nothing — on another tab, or naming a skill this site can't run —
 * leaves the address. Both replace the entry, so Back never lands on either.
 *
 * As a navigation lands, the address stays as it is: boot's router is still
 * loading the route, and a replace would start a second navigation whose view
 * transition cancels the first, with an uncaught error. The panel's state
 * reads an old link's hash as open and a param on another tab as closed
 * (discover/skill-panel-state.js), so neither needs the rewrite to show
 * right; the next tab link or reload tidies the address.
 *
 * @param {object}  [options]              - Options.
 * @param {boolean} [options.isNavigation] - Called from hashchange or popstate.
 */
const syncSkillPanelUrl = ( { isNavigation = false } = {} ) => {
	if ( isNavigation ) {
		return;
	}
	const legacySkill = getLegacySkill( getRawHash() );
	if ( legacySkill ) {
		openSkillPanel( legacySkill.slug, { replace: true } );
		return;
	}
	if ( getSkillParam() && ( getRawHash() !== 'discover' || ! getPanelSkill( getSkillParam() ) ) ) {
		closeSkillPanel( { replace: true } );
	}
};

/**
 * Error notice for a failed settings load.
 *
 * @param {object} props         - Component props.
 * @param {string} props.message - The error message to show.
 * @return {object} Component markup.
 */
function LoadErrorNotice( { message } ) {
	return (
		<Notice.Root intent="error">
			<Notice.Description>{ message }</Notice.Description>
		</Notice.Root>
	);
}

/**
 * The AI features section below the Settings tab's MCP content. It carries
 * its own heading, notice and loading states, so it renders whatever state
 * the MCP content above it is in.
 *
 * @param {object}  props           - Component props.
 * @param {boolean} props.showBadge - Whether to mark the section as internal-testing only.
 * @param {object}  props.children  - Section body: the page notice and the feature card.
 * @return {object} Component markup.
 */
function AiFeaturesSection( { showBadge, children } ) {
	return (
		<Stack
			direction="column"
			gap="lg"
			className="jetpack-ai-admin__features-section"
			render={ <section id={ AI_FEATURES_SECTION_ID } aria-labelledby={ AI_FEATURES_TITLE_ID } /> }
		>
			<Stack direction="row" align="center">
				{ /* Focusable from script only: the #/features alias lands focus here. */ }
				<Text variant="heading-lg" render={ <h2 id={ AI_FEATURES_TITLE_ID } tabIndex={ -1 } /> }>
					{ __( 'AI features', 'jetpack' ) }
				</Text>
				{ /* Outside the h2, so the section keeps its plain name. The same badge
				     the gated tabs carry; the section sits behind the same gate. */ }
				{ showBadge && (
					<Badge intent="medium" className="jetpack-ai-admin__tab-badge">
						{ __( 'A12s only', 'jetpack' ) }
					</Badge>
				) }
			</Stack>
			{ children }
		</Stack>
	);
}

/**
 * Breadcrumb nav shown on sub-views: "AI / Read", "AI / Write", etc.
 * Replaces both the page title and the ← Back button.
 *
 * @param {object}   props            - Component props.
 * @param {string}   props.view       - Current sub-view key.
 * @param {Function} props.onNavigate - Called with no args to go back to the Settings tab.
 * @return {object} Component markup.
 */
function Breadcrumbs( { view, onNavigate } ) {
	return (
		<nav aria-label={ __( 'Breadcrumbs', 'jetpack' ) }>
			<ul className="admin-ui-breadcrumbs__list jetpack-ai-admin__breadcrumbs">
				<li>
					<button
						type="button"
						className="jetpack-ai-admin__breadcrumb-link"
						onClick={ onNavigate }
					>
						{ /** "Jetpack AI" is a product name and should not be translated. */ }
						Jetpack AI
					</button>
				</li>
				<li>
					{ /* Focusable from script only: a sub-view opened from a control on
					     its parent lands focus here, on the view's name. */ }
					<span
						className="jetpack-ai-admin__breadcrumb-current"
						aria-current="page"
						tabIndex={ -1 }
					>
						{ VIEW_TITLES[ view ] }
					</span>
				</li>
			</ul>
		</nav>
	);
}

/**
 * Back-link eyebrow shown above sub-view content: "‹ Settings".
 * Labelled with the parent view's title, so it works for any tab's sub-views.
 * Deliberately quiet — small muted text with a chevron, styled in style.scss
 * rather than as a design-system button.
 *
 * @param {object}   props            - Component props.
 * @param {string}   props.label      - The parent view's title.
 * @param {Function} props.onNavigate - Called with no args to go to the parent view.
 * @return {object} Component markup.
 */
function BackEyebrow( { label, onNavigate } ) {
	return (
		<button
			type="button"
			className="jetpack-ai-admin__back-eyebrow"
			onClick={ onNavigate }
			aria-label={ sprintf(
				/* translators: %s: the name of the parent screen, e.g. "Settings". */
				__( 'Back to %s', 'jetpack' ),
				label
			) }
		>
			<Icon icon={ isRTL() ? chevronRight : chevronLeft } size={ 18 } />
			{ label }
		</button>
	);
}

/**
 * Root App component for the Jetpack AI admin page.
 *
 * @return {object} Component markup.
 */
export default function App() {
	// Read at render time, not module scope, so the injected page data is
	// honoured wherever App mounts (the inline script always runs first in
	// production; tests inject per-case).
	const {
		blogId,
		activityLogUrl,
		activityLogFiltered = false,
		apiRoot,
		apiNonce,
		upgradeUrl,
		planName,
		isUserConnected: pageUserConnected,
		isConnected = true,
		hostAllowsAi = true,
		masterEnabled = true,
		masterForcedOff = '',
		userConnectionUrl = 'admin.php?page=my-jetpack#/connection',
		manageUrl = 'admin.php?page=my-jetpack#/features',
		hasMyJetpack = true,
		canConnectSite = true,
		isOfflineMode = false,
		showFeaturesView = false,
		showA12sBadge = false,
		isSelfHosted = false,
	} = window?.jetpackAiSettings ?? {};
	const [ route, setRoute ] = useState( getRouteFromHash );
	const { view, anchor } = route;
	// The view on screen, for the hash listeners, which are bound once.
	const viewRef = useRef( view );
	viewRef.current = view;
	// Set when navigation came from a control that unmounts with its view (the
	// back eyebrow, the breadcrumb link, the skill panel left by Back): focus
	// would silently drop to <body>, stranding keyboard and screen-reader
	// users. An effect below restores it. Flag-based so browser Back/Forward
	// never has its focus hijacked when focus wasn't about to be lost.
	const restoreFocusRef = useRef( false );
	// Set when a control on the Settings view opens a sub-view; the same
	// effect lands focus on the sub-view's name in the breadcrumb.
	const focusSubViewRef = useRef( false );
	// Set by an old #/features link; cleared once the section is scrolled to.
	const [ scrollToFeatures, setScrollToFeatures ] = useState( isFeaturesHash );
	// Save feedback goes through the snackbars boot's layout renders.
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { hasConnectionError } = useConnectionErrorNotice();
	const mcpViewedRecorded = useRef( false );
	// Strict false: older page data (undefined) must not read as unlinked.
	const userUnlinked = pageUserConnected === false;
	// The three gated surfaces share page data's answer, which is right on every
	// host and there on first paint. MCP keeps userUnlinked, unchanged.
	const isUserConnected = ! userUnlinked;
	// MCP settings ride the site's and the user's own WordPress.com connections,
	// so with either one missing the MCP body gives way to a connection notice —
	// and the settings fetch is skipped, since it could only fail.
	const showConnectNotice = !! blogId && userUnlinked;
	const { isLoading, savingToolIds, mcpAbilities, hasMcpAccess, error, updateMcpAbilities } =
		useMcpSettings( { skip: showConnectNotice || ! blogId } );
	const showRemoteAbilities = isSelfHosted && ! showConnectNotice && !! blogId;
	const publishedAbilities = useSiteAbilities( { enabled: showRemoteAbilities } );
	const remoteAbilities = showRemoteAbilities ? publishedAbilities : null;
	const {
		isLoading: isAiSettingsLoading,
		savingKeys: aiSavingKeys,
		settings: aiSettings,
		error: aiSettingsError,
		updateSettings: updateAiSettings,
	} = useFeatureSettings( showFeaturesView );

	// One answer for the page, from page data alone, so it is right on the first
	// paint. Overview asks for usage only when there is nothing to say. The
	// notice speaks for Overview and the AI features section, both behind the
	// host gate — without it the Settings view has nothing for the notice to
	// explain.
	const noticeState = showFeaturesView
		? getPageNoticeState( {
				view,
				blogId,
				isUserConnected,
				isConnected,
				isOfflineMode,
				hostAllowsAi,
				masterEnabled,
				masterForcedOff,
				hasConnectionError,
			} )
		: null;

	// The three things the usage endpoint needs: a registered site, a host that
	// allows AI, and this user's own account linked. Nothing else stops it.
	const canLoadUsage = !! blogId && hostAllowsAi !== false && isUserConnected !== false;

	// The hash is the single source of truth for the current view: popstate
	// covers back/forward, hashchange covers direct hash edits and links.
	useEffect( () => {
		syncSkillPanelUrl();
		const syncViewFromHash = () => {
			syncSkillPanelUrl( { isNavigation: true } );
			const nextRoute = getRouteFromHash();
			// Back from a skill's panel to another tab unmounts the panel with
			// Discover, and the focus in it with them. The view's tab takes it.
			const { activeElement } = document;
			if (
				nextRoute.view !== viewRef.current &&
				activeElement?.closest?.( SKILL_PANEL_SELECTOR )
			) {
				restoreFocusRef.current = true;
			}
			setRoute( nextRoute );
			setScrollToFeatures( isFeaturesHash() );
		};
		window.addEventListener( 'popstate', syncViewFromHash );
		window.addEventListener( 'hashchange', syncViewFromHash );
		return () => {
			window.removeEventListener( 'popstate', syncViewFromHash );
			window.removeEventListener( 'hashchange', syncViewFromHash );
		};
	}, [] );

	const tabViews = getTabViews();
	const hasTabBar = tabViews.length > 1;
	const isSubView = MCP_SUB_VIEWS.includes( view );
	// Boot's stage gives up its width while a skill's side panel is open.
	const isPanelOpen = !! useOpenSkillSlug();
	// Below boot's medium break the panel covers the stage, full screen, so
	// the hub behind it leaves the tab order and the accessibility tree, as
	// it would behind a modal. Boot's stage itself goes, not just AdminPage:
	// a scroller with nothing focusable left inside takes a Tab stop of its
	// own. Snackbars and the speak region sit outside it.
	const isPanelCovering = useViewportMatch( 'medium', '<' ) && isPanelOpen;
	const contentRef = useRef( null );
	useEffect( () => {
		const content = contentRef.current;
		const root =
			content?.closest( '.boot-layout__stage' ) ?? content?.closest( '.jp-admin-page' ) ?? content;
		if ( ! root || ! isPanelCovering ) {
			return;
		}
		root.setAttribute( 'inert', '' );
		return () => root.removeAttribute( 'inert' );
	}, [ isPanelCovering ] );
	const isMcpContext = view === 'mcp' || MCP_SUB_VIEWS.includes( view );
	// The first path segment names the owning tab, so sub-views keep their
	// parent tab (Settings) selected.
	const activeTab = view.split( '/' )[ 0 ];

	// Recorded wherever there are tabs to choose between — Discover and
	// Scheduled tasks can bring the bar without the host gate. An old #/features
	// link names the section it meant; the hash is current here, since the view
	// always follows it.
	useEffect( () => {
		if ( ! hasTabBar ) {
			return;
		}
		recordAiHubEvent( EVENTS.VIEWED, {
			tab: activeTab,
			...( showFeaturesView && isFeaturesHash() ? { section: 'ai_features' } : {} ),
		} );
	}, [ activeTab, hasTabBar, showFeaturesView ] );

	useEffect( () => {
		if ( ! isLoading && hasMcpAccess && isMcpContext && ! mcpViewedRecorded.current ) {
			mcpViewedRecorded.current = true;
			// blog_id is attached automatically by the analytics library from
			// window.jpTracksContext, which the page sets via an inline script.
			recordMcpTracksEvent( 'jetpack_mcp_settings_viewed', {
				ref: SETTINGS_REF,
			} );
		}
	}, [ isLoading, hasMcpAccess, isMcpContext ] );

	// An old #/features link lands on the Settings view; bring the section it
	// meant into view. Wait for both loads, or the MCP content settling above
	// would push the section back down after the scroll. Leaving the view first
	// drops the request, so a later return to Settings does not scroll out of
	// nowhere.
	useEffect( () => {
		if ( ! scrollToFeatures ) {
			return;
		}
		if ( view !== 'mcp' ) {
			setScrollToFeatures( false );
			return;
		}
		if ( isLoading || isAiSettingsLoading ) {
			return;
		}
		setScrollToFeatures( false );
		// Absent behind the host gate, where the link falls back to plain MCP.
		document.getElementById( AI_FEATURES_SECTION_ID )?.scrollIntoView?.( { block: 'start' } );
		// The link meant the section, so a keyboard or screen-reader user starts
		// there too. Already scrolled, so the focus must not scroll again.
		document.getElementById( AI_FEATURES_TITLE_ID )?.focus( { preventScroll: true } );
	}, [ scrollToFeatures, view, isLoading, isAiSettingsLoading ] );

	const handleUpdate = useCallback(
		update => {
			return updateMcpAbilities( update ).catch( () => {
				// Errors must not auto-vanish before they're read. The fixed id
				// makes the store replace the previous outcome for this surface,
				// so retries never show stale results alongside fresh ones.
				createErrorNotice( __( 'Failed to save MCP settings. Please try again.', 'jetpack' ), {
					type: 'snackbar',
					id: 'jetpack-mcp-save-status',
					explicitDismiss: true,
				} );
			} );
		},
		[ updateMcpAbilities, createErrorNotice ]
	);

	const handleAiSettingsUpdate = useCallback(
		update => {
			// Resolve a boolean rather than letting the rejection escape: the
			// AI features card records analytics only for saves that landed.
			return updateAiSettings( update ).then(
				() => {
					// The shared id keeps this surface last-outcome-wins: a
					// success replaces a sticky error from an earlier attempt.
					createSuccessNotice( __( 'Your AI settings have been saved.', 'jetpack' ), {
						type: 'snackbar',
						id: 'jetpack-ai-save-status',
					} );
					return true;
				},
				() => {
					// Errors must not auto-vanish before they're read.
					createErrorNotice( __( 'Failed to save AI settings. Please try again.', 'jetpack' ), {
						type: 'snackbar',
						id: 'jetpack-ai-save-status',
						explicitDismiss: true,
					} );
					return false;
				}
			);
		},
		[ updateAiSettings, createSuccessNotice, createErrorNotice ]
	);

	// Every in-app move lands on a view with no skill panel open.
	const navigateToView = useCallback( newView => {
		window.history.pushState( { [ IN_APP_HISTORY_KEY ]: true }, '', getViewHref( newView ) );
		setRoute( { view: newView, anchor: null } );
		// In-app navigation never means the old #/features section.
		setScrollToFeatures( false );
	}, [] );

	const tabsRef = useRef( null );

	// Publish the sticky strip's height for the scroll margins (style.scss).
	// Measured, as Discover's toolbar offset is: the Tabs' height follows the
	// font and can wrap.
	useLayoutEffect( () => {
		const strip = tabsRef.current;
		const content = contentRef.current;
		if ( ! strip || ! content ) {
			return;
		}
		const update = () =>
			content.style.setProperty( TABS_HEIGHT_PROPERTY, `${ getStickyHeight( strip ) }px` );
		update();
		if ( typeof window.ResizeObserver === 'undefined' ) {
			return () => content.style.removeProperty( TABS_HEIGHT_PROPERTY );
		}
		const observer = new window.ResizeObserver( update );
		observer.observe( strip );
		return () => {
			observer.disconnect();
			content.style.removeProperty( TABS_HEIGHT_PROPERTY );
		};
	}, [ hasTabBar ] );

	useEffect( () => {
		// A sub-view opened from Settings: the control that opened it left
		// with the Settings view, so its name in the breadcrumb takes focus.
		if ( focusSubViewRef.current ) {
			focusSubViewRef.current = false;
			const current = document.querySelector( '.jetpack-ai-admin__breadcrumb-current' );
			if ( current && current.ownerDocument.activeElement === current.ownerDocument.body ) {
				current.focus();
			}
			return;
		}
		if ( ! restoreFocusRef.current ) {
			return;
		}
		restoreFocusRef.current = false;
		// Only act if the focused control really unmounted, or sits in a skill
		// panel that is closing on its way out; land on the selected tab, the
		// view's stable landmark. In the ungated MCP-only shape there is no tab
		// bar, so there is nothing to do — no worse than the unmanaged focus it
		// replaces.
		const tabsElement = tabsRef.current;
		if ( ! tabsElement ) {
			return;
		}
		const { activeElement, body } = tabsElement.ownerDocument;
		if ( activeElement === body || activeElement?.closest( SKILL_PANEL_SELECTOR ) ) {
			tabsElement.querySelector( '[role="tab"][aria-selected="true"]' )?.focus();
		}
	}, [ view ] );

	// Shared by the back eyebrow and the active-tab click below: a sub-view's
	// parent is always its tab's root view. The focus flag is harmless for the
	// tab click — the tab persists and keeps focus, so the effect no-ops.
	const navigateToParent = useCallback( () => {
		restoreFocusRef.current = true;
		navigateToView( activeTab );
	}, [ activeTab, navigateToView ] );

	// The breadcrumb back link mirrors the browser Back button so the history
	// entry for the sub-view is popped rather than a new entry being pushed.
	// The view change lands asynchronously via popstate; the flag survives.
	// A sub-view opened straight from a link has nothing in-app behind it —
	// Back would leave wp-admin — so it goes to its parent instead.
	const navigateBack = useCallback( () => {
		if ( ! hasInAppHistory() ) {
			navigateToParent();
			return;
		}
		restoreFocusRef.current = true;
		window.history.back();
	}, [ navigateToParent ] );

	// Settings navigation targets are sub-views; McpHub calls this with their
	// bare keys ('read' | 'write' | 'setup'), which live under the mcp path
	// segment.
	// Whether the Settings hub itself renders: the access toggle, the Read and
	// Write rows and the setup sub-view all need a linked site with MCP access.
	const hasHub = ! isLoading && ! error && !! blogId && ! userUnlinked && hasMcpAccess;

	const handleMcpNavigate = useCallback(
		subView => {
			focusSubViewRef.current = true;
			navigateToView( 'mcp/' + subView );
		},
		[ navigateToView ]
	);

	// Tabs never re-emit the already-selected value, so on sub-views — where
	// the parent tab is selected but the view is deeper — a click on that tab
	// reaches only this handler. Route it back to the tab's root view. Clicks
	// on unselected tabs fall through to onValueChange as usual.
	const handleTabClick = useCallback(
		event => {
			if ( isSubView && event.currentTarget.getAttribute( 'aria-selected' ) === 'true' ) {
				navigateToParent();
			}
		},
		[ isSubView, navigateToParent ]
	);

	// MCP rides the same connection, so on the Settings view a notice about the
	// connection speaks for the whole view, once, from the top — in place of
	// MCP's own not-connected warning and connect callout. Every other state
	// explains the feature toggles, so it stays inside their section. Behind the
	// host gate noticeState is null and the Settings view is unchanged.
	const isMcpConnectionNotice = view === 'mcp' && isConnectionNoticeState( noticeState );

	// Rendered above Overview, and on the Settings view above the view or inside
	// the AI features section (see isMcpConnectionNotice).
	const pageNotice = (
		<PageNotice
			state={ noticeState }
			masterForcedOff={ masterForcedOff }
			userConnectionUrl={ userConnectionUrl }
			manageUrl={ manageUrl }
			hasMyJetpack={ hasMyJetpack }
			canConnectSite={ canConnectSite }
		/>
	);

	return (
		<AdminPage
			title={ isSubView ? undefined : 'Jetpack AI' /* Product name, not translated. */ }
			subTitle={
				isSubView
					? SUB_VIEW_DESCRIPTIONS[ view ]
					: __( 'Connect your AI agent, give it skills, and decide what it can do.', 'jetpack' )
			}
			breadcrumbs={
				isSubView ? <Breadcrumbs view={ view } onNavigate={ navigateBack } /> : undefined
			}
			// The tab bar visually separates the header from the content; the
			// border is only needed in the MCP-only shape where no tabs render.
			showBottomBorder={ isSubView && tabViews.length === 1 }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
		>
			{ tabViews.length > 1 && (
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal" ref={ tabsRef }>
					<Tabs.Root value={ activeTab } onValueChange={ navigateToView }>
						<Tabs.List variant="minimal" aria-label={ __( 'AI sections', 'jetpack' ) }>
							{ tabViews.map( tab => (
								<Tabs.Tab key={ tab } value={ tab } onClick={ handleTabClick }>
									{ VIEW_TITLES[ tab ] }
									{ /* Keep the badge when a host exposes these views to internal testers. */ }
									{ showA12sBadge && GATED_VIEWS.includes( tab ) && (
										<Badge intent="medium" className="jetpack-ai-admin__tab-badge">
											{ __( 'A12s only', 'jetpack' ) }
										</Badge>
									) }
								</Tabs.Tab>
							) ) }
						</Tabs.List>
						{ /* These tabs navigate between sibling views rather than rendering
						     their content inside the tab root. Keep empty panels so the
						     design-system Tabs validator can pair every tab with a panel. */ }
						{ tabViews.map( tab => (
							<Tabs.Panel key={ tab } value={ tab } />
						) ) }
					</Tabs.Root>
				</div>
			) }
			{ /* Outside the padded content div, so it takes the page gutter via `inset`. */ }
			<JitmSlot inset />
			{ /* Every tab shares one column width, so headings and cards keep the
			     same left edge from tab to tab. The modifiers carry only what
			     differs inside it. */ }
			<div
				ref={ contentRef }
				className={ `jetpack-ai-admin__content${
					activeTab === 'discover' ? ' jetpack-ai-admin__content--discover' : ''
				}${ isPanelOpen ? ' jetpack-ai-admin__content--panel-open' : '' }` }
			>
				{ isSubView && (
					<BackEyebrow label={ VIEW_TITLES[ activeTab ] } onNavigate={ navigateToParent } />
				) }

				{ ( view !== 'mcp' || isMcpConnectionNotice ) && pageNotice }

				{ isMcpContext && (
					<>
						{ isLoading && <LoadingSpinner /> }

						{ ! isLoading && error && ! showConnectNotice && <LoadErrorNotice message={ error } /> }

						{ ! blogId && ! isMcpConnectionNotice && (
							<Notice.Root intent="warning">
								<Notice.Description>
									{ __(
										'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
										'jetpack'
									) }
								</Notice.Description>
							</Notice.Root>
						) }

						{ showConnectNotice && ! isMcpConnectionNotice && (
							<McpConnectCallout userConnectionUrl={ userConnectionUrl } />
						) }

						{ ! isLoading && ! error && !! blogId && ! userUnlinked && ! hasMcpAccess && (
							<McpUpsell />
						) }

						{ /* Without the hub — offline, disconnected, unlinked, or no MCP
						     access — the connect buttons still show: installing the
						     connector happens in the agent, and the notice above says what
						     the site needs first. The setup steps live in the hub, so the
						     "Other agents" link waits for it. Overview carries the card
						     whenever that tab exists. */ }
						{ view === 'mcp' && ! isLoading && ! hasHub && ! tabViews.includes( 'overview' ) && (
							<McpConnectAgents
								isMcpEnabled
								onNavigate={ handleMcpNavigate }
								showOtherAgents={ false }
							/>
						) }

						{ hasHub && (
							<Stack direction="column" gap="lg">
								{ view === 'mcp' && (
									<McpHub
										remoteAbilities={ remoteAbilities }
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										activityLogUrl={ activityLogUrl }
										activityLogFiltered={ activityLogFiltered }
										savingToolIds={ savingToolIds }
										onNavigate={ handleMcpNavigate }
										onUpdate={ handleUpdate }
										// The activity log has exactly one home: Overview owns the
										// row whenever the Overview tab exists; the Settings hub
										// keeps it in the ungated MCP-only shape.
										showActivityLog={ ! tabViews.includes( 'overview' ) }
										// The connect card's home follows the same rule.
										showConnectCard={ ! tabViews.includes( 'overview' ) }
									/>
								) }
								{ view === 'mcp/read' && (
									<McpRead
										remoteAbilities={ remoteAbilities }
										anchor={ anchor }
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										savingToolIds={ savingToolIds }
										onUpdate={ handleUpdate }
									/>
								) }
								{ view === 'mcp/write' && (
									<McpWrite
										remoteAbilities={ remoteAbilities }
										anchor={ anchor }
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										savingToolIds={ savingToolIds }
										onUpdate={ handleUpdate }
									/>
								) }
								{ view === 'mcp/setup' && <McpSetup /> }
							</Stack>
						) }
					</>
				) }

				{ /* A sibling of the MCP content, not part of it: the upsell, the
				     connection asks, a load error or the spinner above never hide it. */ }
				{ view === 'mcp' && showFeaturesView && (
					<AiFeaturesSection showBadge={ showA12sBadge }>
						{ ! isMcpConnectionNotice && pageNotice }

						{ isAiSettingsLoading && <LoadingSpinner /> }

						{ ! isAiSettingsLoading && aiSettingsError && (
							<LoadErrorNotice message={ aiSettingsError } />
						) }

						{ /* The host gate comes from page data, the same answer the notice uses:
						    two sources, computed in two requests, could disagree into a section
						    with no card and no notice. */ }
						{ ! isAiSettingsLoading && ! aiSettingsError && hostAllowsAi !== false && (
							<AiFeatures
								settings={ aiSettings }
								isUserConnected={ isUserConnected }
								masterForcedOff={ masterForcedOff }
								savingKeys={ aiSavingKeys }
								onUpdate={ handleAiSettingsUpdate }
							/>
						) }
					</AiFeaturesSection>
				) }

				{ view === 'overview' && (
					<AiOverview
						activityLogUrl={ activityLogUrl }
						activityLogFiltered={ activityLogFiltered }
						upgradeUrl={ upgradeUrl }
						planName={ planName }
						canLoadUsage={ canLoadUsage }
						// Without the hub (offline, disconnected, unlinked, or no MCP
						// access) the connect buttons still show: installing the
						// connector happens in the agent. The setup steps live in the
						// hub, so the "Other agents" link waits for it.
						isMcpEnabled={ ! hasHub || getSiteLevelEnabled( mcpAbilities ?? {}, blogId ) }
						showOtherAgents={ hasHub }
						onMcpNavigate={ handleMcpNavigate }
						// Same preconditions the Settings hub applies to its copy of the row.
						showActivityLog={
							!! blogId && hasMcpAccess && getSiteLevelEnabled( mcpAbilities ?? {}, blogId )
						}
					/>
				) }

				{ activeTab === 'discover' && <Discover /> }

				{ view === 'scheduled-tasks' && (
					<ChunkErrorBoundary>
						<Suspense fallback={ <LoadingSpinner /> }>
							<ScheduledTasks
								blogId={ blogId }
								apiNonce={ apiNonce }
								createSuccessNotice={ createSuccessNotice }
								createErrorNotice={ createErrorNotice }
							/>
						</Suspense>
					</ChunkErrorBoundary>
				) }
			</div>
		</AdminPage>
	);
}
