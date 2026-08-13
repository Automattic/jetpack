/**
 * Root component for the Jetpack AI admin page.
 *
 * Three top-level tabs (Overview | Features | MCP Settings) with hash-based
 * routing. The MCP tab owns the read | write | setup sub-views, which render
 * with breadcrumbs in place of the tab bar.
 *
 * The Overview and Features tabs are limited to internal testing environments
 * for now (jetpackAiSettings.showFeaturesView): without the flag the page
 * keeps its original MCP-only shape, with the MCP hub as the landing view and
 * no tab bar.
 */

import { AdminPage, GlobalNotices, useGlobalNotices } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Notice, Stack, Tabs } from '@wordpress/ui';
import AiFeatures from './features/index';
import { useFeatureSettings } from './features/use-feature-settings';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import { recordMcpTracksEvent } from './mcp/tracks';
import McpUpsell from './mcp/upsell';
import { useMcpSettings } from './mcp/use-mcp-settings';
import McpWrite from './mcp/write';
import AiOverview from './overview';

// Matches the `ref` value convention used by the MCP upsell events.
const SETTINGS_REF = 'jetpack-ai-mcp-settings';

const MCP_SUB_VIEWS = [ 'read', 'write', 'setup' ];

// Views that only exist in internal testing environments. MCP Settings ships
// publicly, so it is not in here.
const GATED_VIEWS = [ 'overview', 'features' ];

// Read at call time, not module scope, so the flag reflects the injected page data.
const getTabViews = () =>
	window?.jetpackAiSettings?.showFeaturesView ? [ 'overview', 'features', 'mcp' ] : [ 'mcp' ];

// The first tab is the default: Overview when visible (matching the design),
// otherwise the MCP hub. A hash pointing at a hidden view falls back too.
const getViewFromHash = () => {
	const tabViews = getTabViews();
	const hash = window.location.hash.replace( /^#\//, '' );
	return [ ...tabViews, ...MCP_SUB_VIEWS ].includes( hash ) ? hash : tabViews[ 0 ];
};

const VIEW_TITLES = {
	overview: __( 'Overview', 'jetpack' ),
	// "WordPress Agent" is a product name and should not be translated.
	features: 'WordPress Agent',
	mcp: __( 'MCP Settings', 'jetpack' ),
	read: __( 'Read', 'jetpack' ),
	write: __( 'Write', 'jetpack' ),
	setup: __( 'Connect external AI agent', 'jetpack' ),
};

const SUB_VIEW_DESCRIPTIONS = {
	read: __( 'View your site’s content.', 'jetpack' ),
	write: __( 'Create, update, and manage content on your site.', 'jetpack' ),
	setup: __( 'Get instructions for connecting your external AI assistant.', 'jetpack' ),
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
						{ /** "AI" is a product name and should not be translated. */ }
						AI
					</button>
				</li>
				<li>
					<span className="jetpack-ai-admin__breadcrumb-current">{ VIEW_TITLES[ view ] }</span>
				</li>
			</ul>
		</nav>
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
	const { blogId, activityLogUrl, apiRoot, apiNonce, upgradeUrl, planName } =
		window?.jetpackAiSettings ?? {};
	const [ view, setView ] = useState( getViewFromHash );
	// Save feedback goes through the shared GlobalNotices snackbars (the
	// design-system SnackbarList behind @wordpress/notices): transient,
	// auto-dismissing, no page-level styling needed.
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const mcpViewedRecorded = useRef( false );
	const { isLoading, savingToolIds, mcpAbilities, hasMcpAccess, error, updateMcpAbilities } =
		useMcpSettings();
	const {
		isLoading: isAiSettingsLoading,
		savingKeys: aiSavingKeys,
		settings: aiSettings,
		error: aiSettingsError,
		updateSettings: updateAiSettings,
	} = useFeatureSettings();

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

	// The breadcrumb back link mirrors the browser Back button so the history
	// entry for the sub-view is popped rather than a new entry being pushed.
	const navigateBack = useCallback( () => window.history.back(), [] );

	// MCP navigation targets are sub-views; McpHub calls this with their keys.
	const handleMcpNavigate = useCallback( subView => navigateToView( subView ), [ navigateToView ] );

	return (
		<AdminPage
			title={ isSubView ? undefined : 'AI' /* "AI" is a product name, not translated. */ }
			subTitle={
				isSubView
					? SUB_VIEW_DESCRIPTIONS[ view ]
					: __( 'Control how AI agents interact with your site.', 'jetpack' )
			}
			breadcrumbs={
				isSubView ? <Breadcrumbs view={ view } onNavigate={ navigateBack } /> : undefined
			}
			showBottomBorder={ isSubView }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
		>
			{ ! isSubView && tabViews.length > 1 && (
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.Root value={ view } onValueChange={ navigateToView }>
						<Tabs.List variant="minimal" aria-label={ __( 'AI sections', 'jetpack' ) }>
							{ tabViews.map( tab => (
								<Tabs.Tab key={ tab } value={ tab }>
									{ VIEW_TITLES[ tab ] }
									{ /* Overview and Features ship behind the internal-testing gate;
									     while gated, label them so Automatticians don't mistake them
									     for public UI. getTabViews() only emits these two when the
									     flag is on, so their presence is the check. Remove with
									     the gate. */ }
									{ GATED_VIEWS.includes( tab ) && (
										<Badge intent="medium" className="jetpack-ai-admin__tab-badge">
											{ __( 'A12s only', 'jetpack' ) }
										</Badge>
									) }
								</Tabs.Tab>
							) ) }
						</Tabs.List>
					</Tabs.Root>
				</div>
			) }
			<div className="jetpack-ai-admin__content">
				<GlobalNotices />

				{ isMcpContext && (
					<>
						{ isLoading && (
							<div className="jetpack-ai-admin__loading">
								<Spinner />
							</div>
						) }

						{ ! isLoading && error && <LoadErrorNotice message={ error } /> }

						{ ! isLoading && ! error && ! blogId && (
							<Notice.Root intent="warning">
								<Notice.Description>
									{ __(
										'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
										'jetpack'
									) }
								</Notice.Description>
							</Notice.Root>
						) }

						{ ! isLoading && ! error && !! blogId && ! hasMcpAccess && <McpUpsell /> }

						{ ! isLoading && ! error && !! blogId && hasMcpAccess && (
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
								{ view === 'read' && (
									<McpRead
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										savingToolIds={ savingToolIds }
										onUpdate={ handleUpdate }
									/>
								) }
								{ view === 'write' && (
									<McpWrite
										mcpAbilities={ mcpAbilities }
										blogId={ blogId }
										savingToolIds={ savingToolIds }
										onUpdate={ handleUpdate }
									/>
								) }
								{ view === 'setup' && <McpSetup /> }
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
			</div>
		</AdminPage>
	);
}
