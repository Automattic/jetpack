/**
 * Root component for the Jetpack AI admin page.
 *
 * Manages the view stack (hub → read | write | setup) and owns the MCP settings state.
 */

import { AdminPage } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Stack } from '@wordpress/ui';
import analytics from 'lib/analytics';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import McpUpsell from './mcp/upsell';
import { useMcpSettings } from './mcp/use-mcp-settings';
import McpWrite from './mcp/write';

const { blogId, activityLogUrl, apiRoot, apiNonce } = window?.jetpackAiSettings ?? {};

const VALID_VIEWS = [ 'read', 'write', 'setup' ];

const getViewFromHash = () => {
	const hash = window.location.hash.replace( /^#\//, '' );
	return VALID_VIEWS.includes( hash ) ? hash : 'hub';
};

const VIEW_TITLES = {
	hub: 'AI', // "AI" is a product name and should not be translated.
	read: __( 'Read', 'jetpack' ),
	write: __( 'Write', 'jetpack' ),
	setup: __( 'Connect external AI agent', 'jetpack' ),
};

const VIEW_DESCRIPTIONS = {
	hub: __( 'Control how AI agents interact with your site.', 'jetpack' ),
	read: __( 'View your site\u2019s content.', 'jetpack' ),
	write: __( 'Create, update, and manage content on your site.', 'jetpack' ),
	setup: __( 'Get instructions for connecting your external AI assistant.', 'jetpack' ),
};

/**
 * Breadcrumb nav shown on sub-views: "AI / Read", "AI / Write", etc.
 * Replaces both the page title and the ← Back button.
 *
 * @param {object}   props            - Component props.
 * @param {string}   props.view       - Current sub-view key.
 * @param {Function} props.onNavigate - Called with no args to go back to hub.
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
	const { isLoading, savingToolIds, mcpAbilities, hasMcpAccess, error, updateMcpAbilities } =
		useMcpSettings();

	useEffect( () => {
		// Tag the initial history entry so the popstate handler can restore the hub view.
		window.history.replaceState( { view: getViewFromHash() }, '' );
		const handlePopState = event => setView( event.state?.view ?? 'hub' );
		window.addEventListener( 'popstate', handlePopState );
		return () => window.removeEventListener( 'popstate', handlePopState );
	}, [] );

	useEffect( () => {
		if ( ! isLoading && hasMcpAccess ) {
			analytics.tracks.recordEvent( 'jetpack_mcp_settings_viewed' );
		}
	}, [ isLoading, hasMcpAccess ] );

	const handleUpdate = useCallback(
		update => {
			setSaveError( null );
			return updateMcpAbilities( update ).catch( () => {
				setSaveError( __( 'Failed to save MCP settings. Please try again.', 'jetpack' ) );
			} );
		},
		[ updateMcpAbilities ]
	);

	const dismissSaveError = useCallback( () => setSaveError( null ), [] );

	const navigateToView = useCallback( newView => {
		window.history.pushState( { view: newView }, '', '#/' + newView );
		setView( newView );
	}, [] );

	// The breadcrumb back link mirrors the browser Back button so the history
	// entry for the sub-view is popped rather than a new hub entry being pushed.
	const navigateBack = useCallback( () => window.history.back(), [] );

	const isSubView = view !== 'hub';

	return (
		<AdminPage
			title={ isSubView ? undefined : VIEW_TITLES.hub }
			subTitle={ VIEW_DESCRIPTIONS[ view ] }
			breadcrumbs={
				isSubView ? <Breadcrumbs view={ view } onNavigate={ navigateBack } /> : undefined
			}
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
		>
			<div className="jetpack-ai-admin__content">
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

				{ ! isLoading && saveError && (
					<Notice.Root intent="error">
						<Notice.Description>{ saveError }</Notice.Description>
						<Notice.CloseIcon label={ __( 'Dismiss', 'jetpack' ) } onClick={ dismissSaveError } />
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
						{ view === 'hub' && (
							<McpHub
								mcpAbilities={ mcpAbilities }
								blogId={ blogId }
								activityLogUrl={ activityLogUrl }
								savingToolIds={ savingToolIds }
								onNavigate={ navigateToView }
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
			</div>
		</AdminPage>
	);
}
