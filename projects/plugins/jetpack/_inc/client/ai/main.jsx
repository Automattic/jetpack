/**
 * Root component for the Jetpack AI admin page.
 *
 * Two top-level tabs (Features | MCP Settings) with hash-based routing.
 * The MCP tab owns the read | write | setup sub-views, which render with
 * breadcrumbs in place of the tab bar.
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

const TAB_VIEWS = [ 'features', 'mcp' ];
const MCP_SUB_VIEWS = [ 'read', 'write', 'setup' ];
const VALID_VIEWS = [ ...TAB_VIEWS, ...MCP_SUB_VIEWS ];

// Features is the default tab, matching the design.
const getViewFromHash = () => {
	const hash = window.location.hash.replace( /^#\//, '' );
	return VALID_VIEWS.includes( hash ) ? hash : 'features';
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
			setSaveError( null );
			return updateAiSettings( update ).catch( () => {
				setSaveError( __( 'Failed to save AI settings. Please try again.', 'jetpack' ) );
			} );
		},
		[ updateAiSettings ]
	);

	const dismissSaveError = useCallback( () => setSaveError( null ), [] );

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
			{ ! isSubView && (
				<div className="jp-admin-page-tabs">
					<Tabs.Root value={ view } onValueChange={ navigateToView }>
						<Tabs.List aria-label={ __( 'AI sections', 'jetpack' ) }>
							{ TAB_VIEWS.map( tab => (
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

				{ isMcpContext && (
					<>
						{ isLoading && (
							<div className="jetpack-ai-admin__loading">
								<Spinner />
							</div>
						) }

						{ ! isLoading && error && (
							<Notice.Root intent="error">
								<Notice.Description>{ error }</Notice.Description>
							</Notice.Root>
						) }

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
							<Notice.Root intent="error">
								<Notice.Description>{ aiSettingsError }</Notice.Description>
							</Notice.Root>
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
