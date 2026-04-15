/**
 * Root component for the Jetpack AI admin page.
 *
 * Manages the view stack (hub → read | write | setup) and owns the MCP settings state.
 */

import { AdminPage } from '@automattic/jetpack-components';
import { Button, Notice, Spinner, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowLeft } from '@wordpress/icons';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import { useMcpSettings } from './mcp/use-mcp-settings';
import McpWrite from './mcp/write';

const { blogId, apiRoot, apiNonce } = window?.jetpackAiSettings ?? {};

const VIEW_TITLES = {
	hub: __( 'AI', 'jetpack' ),
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
 * Root App component for the Jetpack AI admin page.
 *
 * @return {object} Component markup.
 */
export default function App() {
	const [ view, setView ] = useState( 'hub' );
	const [ saveError, setSaveError ] = useState( null );
	const { isLoading, isSaving, mcpAbilities, error, updateMcpAbilities } = useMcpSettings();

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
	const navigateBack = useCallback( () => setView( 'hub' ), [] );

	const isSubView = view !== 'hub';

	return (
		<AdminPage
			title={ VIEW_TITLES[ view ] }
			subTitle={ VIEW_DESCRIPTIONS[ view ] }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			showFooter={ false }
		>
			<div className="jetpack-ai-admin">
				{ isSubView && (
					<Button
						className="jetpack-ai-admin__back"
						variant="tertiary"
						icon={ arrowLeft }
						onClick={ navigateBack }
					>
						{ __( 'Back', 'jetpack' ) }
					</Button>
				) }

				<div className="jetpack-ai-admin__content">
					{ isLoading && (
						<div className="jetpack-ai-admin__loading">
							<Spinner />
						</div>
					) }

					{ ! isLoading && error && (
						<Notice status="error" isDismissible={ false }>
							{ error }
						</Notice>
					) }

					{ ! isLoading && saveError && (
						<Notice status="error" onRemove={ dismissSaveError }>
							{ saveError }
						</Notice>
					) }

					{ ! isLoading && ! error && ! blogId && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
								'jetpack'
							) }
						</Notice>
					) }

					{ ! isLoading && ! error && !! blogId && (
						<VStack spacing={ 4 }>
							{ view === 'hub' && (
								<McpHub
									mcpAbilities={ mcpAbilities }
									blogId={ blogId }
									isSaving={ isSaving }
									onNavigate={ setView }
									onUpdate={ handleUpdate }
								/>
							) }
							{ view === 'read' && (
								<McpRead
									mcpAbilities={ mcpAbilities }
									blogId={ blogId }
									isSaving={ isSaving }
									onUpdate={ handleUpdate }
								/>
							) }
							{ view === 'write' && (
								<McpWrite
									mcpAbilities={ mcpAbilities }
									blogId={ blogId }
									isSaving={ isSaving }
									onUpdate={ handleUpdate }
								/>
							) }
							{ view === 'setup' && <McpSetup /> }
						</VStack>
					) }
				</div>
			</div>
		</AdminPage>
	);
}
