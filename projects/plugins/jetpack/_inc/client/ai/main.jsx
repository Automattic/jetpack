/**
 * Root component for the Jetpack AI admin page.
 *
 * Four top-level tabs (Overview | WordPress Agent | Scheduled tasks | MCP Settings) with hash-based
 * routing. The MCP tab owns the mcp/read | mcp/write | mcp/setup sub-views,
 * which render with breadcrumbs in place of the page title while keeping the
 * tab bar — with MCP Settings selected, since the first path segment names the
 * owning tab — so top-level navigation is always available.
 *
 * Overview and WordPress Agent share an internal-testing gate. Scheduled tasks
 * is controlled independently by the ai-hub-scheduled-tasks server-side feature
 * flag. Without either flag the page keeps its original MCP-only shape, with the
 * MCP hub as the landing view and no tab bar.
 */

import { AdminPage, GlobalNotices, useGlobalNotices } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, Icon } from '@wordpress/icons';
import { Badge, Notice, Stack, Tabs } from '@wordpress/ui';
import AiFeatures from './features/index';
import { useFeatureSettings } from './features/use-feature-settings';
import McpConnectCallout from './mcp/connect-callout';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import { recordMcpTracksEvent } from './mcp/tracks';
import McpUpsell from './mcp/upsell';
import { useMcpSettings } from './mcp/use-mcp-settings';
import { getSiteLevelEnabled } from './mcp/utils';
import McpWrite from './mcp/write';
import AiOverview from './overview';
import ScheduledTasks from './scheduled-tasks/index';

// Matches the `ref` value convention used by the MCP upsell events.
const SETTINGS_REF = 'jetpack-ai-mcp-settings';

// Sub-views are nested under their owning tab's path segment, so the active
// tab is always the first segment of the view key.
const MCP_SUB_VIEWS = [ 'mcp/read', 'mcp/write', 'mcp/setup' ];

// The sub-views shipped as flat top-level hashes (#/setup) before they were
// nested; keep old bookmarks and external links working.
const LEGACY_VIEW_ALIASES = {
	read: 'mcp/read',
	write: 'mcp/write',
	setup: 'mcp/setup',
};

// Views that only exist in internal testing environments. MCP Settings ships
// publicly, so it is not in here.
const GATED_VIEWS = [ 'overview', 'features' ];

// Read at call time, not module scope, so the flag reflects the injected page data.
const getTabViews = () => {
	const views = [];
	if ( window?.jetpackAiSettings?.showFeaturesView ) {
		views.push( 'overview', 'features' );
	}
	if ( window?.jetpackAiSettings?.featureFlags?.[ 'ai-hub-scheduled-tasks' ] ) {
		views.push( 'scheduled-tasks' );
	}
	views.push( 'mcp' );
	return views;
};

// The first tab is the default: Overview when visible (matching the design),
// otherwise the MCP hub. A hash pointing at a hidden view falls back too.
const getViewFromHash = () => {
	const tabViews = getTabViews();
	const raw = window.location.hash.replace( /^#\//, '' );
	const hash = LEGACY_VIEW_ALIASES[ raw ] ?? raw;
	return [ ...tabViews, ...MCP_SUB_VIEWS ].includes( hash ) ? hash : tabViews[ 0 ];
};

const VIEW_TITLES = {
	overview: __( 'Overview', 'jetpack' ),
	// "WordPress Agent" is a product name and should not be translated.
	features: 'WordPress Agent',
	'scheduled-tasks': __( 'Scheduled tasks', 'jetpack' ),
	mcp: __( 'MCP Settings', 'jetpack' ),
	'mcp/read': __( 'Read', 'jetpack' ),
	'mcp/write': __( 'Write', 'jetpack' ),
	'mcp/setup': __( 'Connect external AI agent', 'jetpack' ),
};

const SUB_VIEW_DESCRIPTIONS = {
	'mcp/read': __( 'View your site’s content.', 'jetpack' ),
	'mcp/write': __( 'Create, update, and manage content on your site.', 'jetpack' ),
	'mcp/setup': __( 'Get instructions for connecting your external AI assistant.', 'jetpack' ),
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
 * Breadcrumb nav shown on MCP sub-views: "AI / Read", "AI / Write", etc.
 * Replaces both the page title and the ← Back button.
 *
 * @param {object}   props            - Component props.
 * @param {string}   props.view       - Current sub-view key.
 * @param {Function} props.onNavigate - Called with no args to go back to the MCP tab.
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
					<span className="jetpack-ai-admin__breadcrumb-current" aria-current="page">
						{ VIEW_TITLES[ view ] }
					</span>
				</li>
			</ul>
		</nav>
	);
}

/**
 * Back-link eyebrow shown above sub-view content: "‹ MCP Settings".
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
				/* translators: %s: the name of the parent screen, e.g. "MCP Settings". */
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
		apiRoot,
		apiNonce,
		upgradeUrl,
		planName,
		isUserConnected,
		showFeaturesView = false,
	} = window?.jetpackAiSettings ?? {};
	const [ view, setView ] = useState( getViewFromHash );
	// Save feedback goes through the shared GlobalNotices snackbars (the
	// design-system SnackbarList behind @wordpress/notices): transient,
	// auto-dismissing, no page-level styling needed.
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const mcpViewedRecorded = useRef( false );
	// Strict false: older page data (undefined) must not read as unlinked.
	const userUnlinked = isUserConnected === false;
	// MCP settings ride the site's and the user's own WordPress.com connections,
	// so with either one missing the MCP body gives way to a connection notice —
	// and the settings fetch is skipped, since it could only fail.
	const showConnectNotice = !! blogId && userUnlinked;
	const { isLoading, savingToolIds, mcpAbilities, hasMcpAccess, error, updateMcpAbilities } =
		useMcpSettings( { skip: showConnectNotice || ! blogId } );
	const {
		isLoading: isAiSettingsLoading,
		savingKeys: aiSavingKeys,
		settings: aiSettings,
		error: aiSettingsError,
		updateSettings: updateAiSettings,
	} = useFeatureSettings( showFeaturesView );

	// The hash is the single source of truth for the current view: popstate
	// covers back/forward, hashchange covers direct hash edits and links.
	useEffect( () => {
		const syncViewFromHash = () => setView( getViewFromHash() );
		window.addEventListener( 'popstate', syncViewFromHash );
		window.addEventListener( 'hashchange', syncViewFromHash );
		return () => {
			window.removeEventListener( 'popstate', syncViewFromHash );
			window.removeEventListener( 'hashchange', syncViewFromHash );
		};
	}, [] );

	const tabViews = getTabViews();
	const isSubView = MCP_SUB_VIEWS.includes( view );
	const isMcpContext = view === 'mcp' || isSubView;
	// The first path segment names the owning tab, so sub-views keep their
	// parent tab (MCP Settings) selected.
	const activeTab = view.split( '/' )[ 0 ];

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

	const handleUpdate = useCallback(
		update => {
			return updateMcpAbilities( update ).catch( () => {
				// Errors must not auto-vanish before they're read. The fixed id
				// makes the store replace the previous outcome for this surface,
				// so retries never show stale results alongside fresh ones.
				createErrorNotice( __( 'Failed to save MCP settings. Please try again.', 'jetpack' ), {
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
			// Features view records analytics only for saves that landed.
			return updateAiSettings( update ).then(
				() => {
					// The shared id keeps this surface last-outcome-wins: a
					// success replaces a sticky error from an earlier attempt.
					createSuccessNotice( __( 'Your AI settings have been saved.', 'jetpack' ), {
						id: 'jetpack-ai-save-status',
					} );
					return true;
				},
				() => {
					// Errors must not auto-vanish before they're read.
					createErrorNotice( __( 'Failed to save AI settings. Please try again.', 'jetpack' ), {
						id: 'jetpack-ai-save-status',
						explicitDismiss: true,
					} );
					return false;
				}
			);
		},
		[ updateAiSettings, createSuccessNotice, createErrorNotice ]
	);

	const navigateToView = useCallback( newView => {
		window.history.pushState( null, '', '#/' + newView );
		setView( newView );
	}, [] );

	// Set when navigation came from a control that unmounts with its view (the
	// back eyebrow, the breadcrumb link): focus would silently drop to <body>,
	// stranding keyboard and screen-reader users. The effect below restores it.
	// Flag-based so browser Back/Forward never has its focus hijacked.
	const restoreFocusRef = useRef( false );
	const tabsRef = useRef( null );

	useEffect( () => {
		if ( ! restoreFocusRef.current ) {
			return;
		}
		restoreFocusRef.current = false;
		// Only act if the focused control really unmounted; land on the
		// selected tab, the view's stable landmark. In the ungated MCP-only
		// shape there is no tab bar, so there is nothing to do — no worse
		// than the unmanaged focus it replaces.
		const tabsElement = tabsRef.current;
		if ( ! tabsElement ) {
			return;
		}
		const { ownerDocument } = tabsElement;
		if ( ownerDocument.activeElement === ownerDocument.body ) {
			tabsElement.querySelector( '[role="tab"][aria-selected="true"]' )?.focus();
		}
	}, [ view ] );

	// The breadcrumb back link mirrors the browser Back button so the history
	// entry for the sub-view is popped rather than a new entry being pushed.
	// The view change lands asynchronously via popstate; the flag survives.
	const navigateBack = useCallback( () => {
		restoreFocusRef.current = true;
		window.history.back();
	}, [] );

	// MCP navigation targets are sub-views; McpHub calls this with their bare
	// keys ('read' | 'write' | 'setup'), which live under the mcp path segment.
	const handleMcpNavigate = useCallback(
		subView => navigateToView( 'mcp/' + subView ),
		[ navigateToView ]
	);

	// Shared by the back eyebrow and the active-tab click below: a sub-view's
	// parent is always its tab's root view. The focus flag is harmless for the
	// tab click — the tab persists and keeps focus, so the effect no-ops.
	const navigateToParent = useCallback( () => {
		restoreFocusRef.current = true;
		navigateToView( activeTab );
	}, [ activeTab, navigateToView ] );

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

	return (
		<AdminPage
			title={ isSubView ? undefined : 'Jetpack AI' /* Product name, not translated. */ }
			subTitle={
				isSubView
					? SUB_VIEW_DESCRIPTIONS[ view ]
					: __( 'Create, connect, and automate with Jetpack AI.', 'jetpack' )
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
									{ /* Overview and Features ship behind the internal-testing gate;
									     label them so Automatticians don't mistake them for public UI.
									     Remove with the gate. */ }
									{ GATED_VIEWS.includes( tab ) && (
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
			<div
				className={ `jetpack-ai-admin__content${
					view === 'scheduled-tasks' ? ' jetpack-ai-admin__content--scheduled-tasks' : ''
				}` }
			>
				{ isSubView && (
					<BackEyebrow label={ VIEW_TITLES[ activeTab ] } onNavigate={ navigateToParent } />
				) }
				<GlobalNotices />

				{ isMcpContext && (
					<>
						{ isLoading && (
							<div className="jetpack-ai-admin__loading">
								<Spinner />
							</div>
						) }

						{ ! isLoading && error && ! showConnectNotice && <LoadErrorNotice message={ error } /> }

						{ ! blogId && (
							<Notice.Root intent="warning">
								<Notice.Description>
									{ __(
										'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
										'jetpack'
									) }
								</Notice.Description>
							</Notice.Root>
						) }

						{ showConnectNotice && <McpConnectCallout /> }

						{ ! isLoading && ! error && !! blogId && ! userUnlinked && ! hasMcpAccess && (
							<McpUpsell />
						) }

						{ ! isLoading && ! error && !! blogId && ! userUnlinked && hasMcpAccess && (
							<Stack direction="column" gap="md">
								{ view === 'mcp' && (
									<McpHub
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										activityLogUrl={ activityLogUrl }
										savingToolIds={ savingToolIds }
										onNavigate={ handleMcpNavigate }
										onUpdate={ handleUpdate }
										// The activity log has exactly one home: Overview owns the
										// row whenever the Overview tab exists; the MCP hub keeps
										// it in the ungated MCP-only shape.
										showActivityLog={ ! tabViews.includes( 'overview' ) }
									/>
								) }
								{ view === 'mcp/read' && (
									<McpRead
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										savingToolIds={ savingToolIds }
										onUpdate={ handleUpdate }
									/>
								) }
								{ view === 'mcp/write' && (
									<McpWrite
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

				{ view === 'overview' && (
					<AiOverview
						blogId={ blogId }
						activityLogUrl={ activityLogUrl }
						upgradeUrl={ upgradeUrl }
						planName={ planName }
						isUserConnected={ isUserConnected }
						hostAllowsAi={ aiSettings?.host_allows_ai }
						// Same preconditions the MCP hub applies to its copy of the
						// row: the copy promises AI-agent actions, which need MCP.
						showActivityLog={
							!! blogId && hasMcpAccess && getSiteLevelEnabled( mcpAbilities ?? {}, blogId )
						}
					/>
				) }

				{ view === 'features' && (
					<>
						{ isAiSettingsLoading && (
							<div className="jetpack-ai-admin__loading">
								<Spinner />
							</div>
						) }

						{ ! isAiSettingsLoading && aiSettingsError && (
							<LoadErrorNotice message={ aiSettingsError } />
						) }

						{ ! isAiSettingsLoading &&
							! aiSettingsError &&
							( aiSettings?.host_allows_ai === false ? (
								<Notice.Root intent="warning">
									<Notice.Description>
										{ __( 'AI has been turned off for this site.', 'jetpack' ) }
									</Notice.Description>
								</Notice.Root>
							) : (
								<AiFeatures
									settings={ aiSettings }
									savingKeys={ aiSavingKeys }
									onUpdate={ handleAiSettingsUpdate }
								/>
							) ) }
					</>
				) }

				{ view === 'scheduled-tasks' && (
					<ScheduledTasks
						blogId={ blogId }
						apiNonce={ apiNonce }
						createSuccessNotice={ createSuccessNotice }
						createErrorNotice={ createErrorNotice }
					/>
				) }
			</div>
		</AdminPage>
	);
}
