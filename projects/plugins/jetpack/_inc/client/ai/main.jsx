/**
 * Root component for the Jetpack AI admin page.
 *
 * Manages the view stack (hub → read | write | setup) and owns the MCP settings state.
 */

import {
	Button,
	Notice,
	Spinner,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowLeft } from '@wordpress/icons';
import McpHub from './mcp/index';
import McpRead from './mcp/read';
import McpSetup from './mcp/setup';
import { useMcpSettings } from './mcp/use-mcp-settings';
import McpWrite from './mcp/write';

const { blogId } = window?.jetpackAiSettings ?? {};

const VIEW_TITLES = {
	hub: __( 'AI settings', 'jetpack' ),
	read: __( 'Read', 'jetpack' ),
	write: __( 'Write', 'jetpack' ),
	setup: __( 'Connect external AI agent', 'jetpack' ),
};

const VIEW_DESCRIPTIONS = {
	hub: __( 'Control how external AI agents can access this site via MCP.', 'jetpack' ),
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
		<div className="jetpack-ai-admin">
			<div className="jetpack-ai-admin__header">
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
				<VStack spacing={ 1 }>
					<Text as="h1" size={ 20 } weight={ 600 }>
						{ VIEW_TITLES[ view ] }
					</Text>
					{ VIEW_DESCRIPTIONS[ view ] && (
						<Text variant="muted">{ VIEW_DESCRIPTIONS[ view ] }</Text>
					) }
				</VStack>
			</div>

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

				{ ! isLoading && ! error && (
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
	);
}
