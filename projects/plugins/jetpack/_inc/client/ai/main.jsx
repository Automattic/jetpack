/**
 * Root component for the Jetpack AI admin page.
 *
 * Two top-level tabs (Features | MCP Settings) with hash-based routing.
 * The MCP tab owns the read | write | setup sub-views, which render with
 * breadcrumbs in place of the tab bar.
 *
 * The Features tab is limited to internal testing environments for now
 * (jetpackAiSettings.showFeaturesView): without the flag the page keeps its
 * original MCP-only shape, with the MCP hub as the landing view and no tab bar.
 */

import { AdminPage } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Stack, Tabs } from '@wordpress/ui';
import analytics from 'lib/analytics';
import AiFeatures from './features/index';
import { useFeatureSettings } from './features/use-feature-settings';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import McpUpsell from './mcp/upsell';
import { useMcpSettings } from './mcp/use-mcp-settings';
import McpWrite from './mcp/write';

const { blogId, activityLogUrl, apiRoot, apiNonce } = window?.jetpackAiSettings ?? {};

const MCP_SUB_VIEWS = [ 'read', 'write', 'setup' ];

// Read at call time, not module scope, so the flag reflects the injected page data.
const getTabViews = () =>
	window?.jetpackAiSettings?.showFeaturesView ? [ 'features', 'mcp' ] : [ 'mcp' ];

// The first tab is the default: Features when visible (matching the design),
// otherwise the MCP hub. A hash pointing at a hidden view falls back too.
const getViewFromHash = () => {
	const tabViews = getTabViews();
	const hash = window.location.hash.replace( /^#\//, '' );
	return [ ...tabViews, ...MCP_SUB_VIEWS ].includes( hash ) ? hash : tabViews[ 0 ];
};

const VIEW_TITLES = {
	features: __( 'Features', 'jetpack' ),
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
	const [ view, setView ] = useState( getViewFromHash );
	const [ saveError, setSaveError ] = useState( null );
	// A single slot, not a stack: the save queue can fire a burst of toggles,
	// and each success replaces the last notice rather than piling them up.
	const [ saveSuccess, setSaveSuccess ] = useState( null );
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
			analytics.tracks.recordEvent( 'jetpack_mcp_settings_viewed' );
		}
	}, [ isLoading, hasMcpAccess, isMcpContext ] );

	const handleUpdate = useCallback(
		update => {
			setSaveError( null );
			return updateMcpAbilities( update ).catch( () => {
				setSaveError( __( 'Failed to save MCP settings. Please try again.', 'jetpack' ) );
			} );
		},
		[ updateMcpAbilities ]
	);

	const handleAiSettingsUpdate = useCallback(
		update => {
			// Clear both notices on each attempt so only the latest outcome shows —
			// one slot, never a stack, even under a burst of queued saves.
			setSaveError( null );
			setSaveSuccess( null );
			// Resolve a boolean rather than letting the rejection escape: the
			// Features view records analytics only for saves that landed.
			return updateAiSettings( update ).then(
				() => {
					setSaveSuccess( __( 'Your AI settings have been saved.', 'jetpack' ) );
					return true;
				},
				() => {
					setSaveError( __( 'Failed to save AI settings. Please try again.', 'jetpack' ) );
					return false;
				}
			);
		},
		[ updateAiSettings ]
	);

	const dismissSaveError = useCallback( () => setSaveError( null ), [] );

	const dismissSaveSuccess = useCallback( () => setSaveSuccess( null ), [] );

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
								</Tabs.Tab>
							) ) }
						</Tabs.List>
					</Tabs.Root>
				</div>
			) }
			<div className="jetpack-ai-admin__content">
				{ saveError && (
					<Notice.Root intent="error">
						<Notice.Description>{ saveError }</Notice.Description>
						<Notice.CloseIcon label={ __( 'Dismiss', 'jetpack' ) } onClick={ dismissSaveError } />
					</Notice.Root>
				) }

				{ /* Success is scoped to the Features tab: it only ever comes from an AI-settings save. */ }
				{ view === 'features' && saveSuccess && (
					<Notice.Root intent="success">
						<Notice.Description>{ saveSuccess }</Notice.Description>
						<Notice.CloseIcon label={ __( 'Dismiss', 'jetpack' ) } onClick={ dismissSaveSuccess } />
					</Notice.Root>
				) }

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
