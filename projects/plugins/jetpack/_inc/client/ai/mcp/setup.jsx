/**
 * MCP Agent Setup view.
 *
 * Shows per-agent quick-setup instructions and a manual config textarea.
 * Ported from client/dashboard/me/mcp/setup/index.tsx in wp-calypso.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	Card,
	CardBody,
	Icon,
	SelectControl,
	TextareaControl,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import { Button, Link, Stack } from '@wordpress/ui';

const MCP_SERVER_NAME = 'wpcom-mcp';
const MCP_SERVER_URL = 'https://public-api.wordpress.com/wpcom/v2/mcp/v1';
const CLAUDE_SETTINGS_CONNECTOR_REDIRECT_SOURCE = 'jetpack-ai-claude-settings-connector';

const CLIENT_OPTIONS = [
	{ label: 'Claude', value: 'claude' },
	{ label: 'Claude Code', value: 'claude-code' },
	{ label: 'Cursor', value: 'cursor' },
	{ label: 'VS Code', value: 'vscode' },
	{ label: 'Continue', value: 'continue' },
	{ label: __( 'Other MCP client', 'jetpack' ), value: 'default' },
];

const CLIENT_DOCS_SOURCES = {
	claude: 'jetpack-ai-docs-claude',
	'claude-code': 'jetpack-ai-docs-claude-code',
	vscode: 'jetpack-ai-docs-vscode',
	cursor: 'jetpack-ai-docs-cursor',
	continue: 'jetpack-ai-docs-continue',
	default: 'jetpack-ai-docs-mcp',
};

const CLIENT_DOCS_LABELS = {
	claude: __( 'Claude documentation', 'jetpack' ),
	'claude-code': __( 'Claude Code documentation', 'jetpack' ),
	vscode: __( 'VS Code documentation', 'jetpack' ),
	cursor: __( 'Cursor documentation', 'jetpack' ),
	continue: __( 'Continue documentation', 'jetpack' ),
	default: __( 'MCP documentation', 'jetpack' ),
};

/**
 * Generate an MCP client configuration JSON object for the given client.
 *
 * @param {string} client - MCP client identifier.
 * @return {object} Configuration object to serialize and copy.
 */
function generateMcpConfig( client ) {
	const baseConfig = { url: MCP_SERVER_URL };
	switch ( client ) {
		case 'claude':
			return { mcpServers: { [ MCP_SERVER_NAME ]: baseConfig } };
		case 'claude-code':
			return {
				mcpServers: { [ MCP_SERVER_NAME ]: { type: 'http', url: MCP_SERVER_URL } },
			};
		case 'vscode':
			return { servers: { [ MCP_SERVER_NAME ]: baseConfig } };
		case 'cursor':
			return { mcpServers: { [ MCP_SERVER_NAME ]: baseConfig } };
		case 'continue':
			return { mcpServers: [ { name: MCP_SERVER_NAME, ...baseConfig } ] };
		default:
			return { mcpServers: { [ MCP_SERVER_NAME ]: baseConfig } };
	}
}

/**
 * MCP Agent Setup view.
 *
 * @return {object} Component markup.
 */
export default function McpSetup() {
	const [ selectedClient, setSelectedClient ] = useState( 'claude' );
	const [ copyStatus, setCopyStatus ] = useState( 'idle' );

	const configText = JSON.stringify( generateMcpConfig( selectedClient ), null, 2 );

	// Read-only textarea requires a no-op onChange to satisfy the controlled input contract.
	const handleConfigChange = useCallback( () => {}, [] );

	const copyToClipboard = useCallback( async () => {
		try {
			await navigator.clipboard.writeText( configText );
			setCopyStatus( 'success' );
			setTimeout( () => setCopyStatus( 'idle' ), 2000 );
		} catch {
			// Clipboard may be blocked — silently fail.
		}
	}, [ configText ] );

	const quickSetupClients = [ 'claude', 'claude-code', 'cursor' ];
	const showQuickSetup = quickSetupClients.includes( selectedClient );

	return (
		<Stack direction="column" gap="md">
			<Card>
				<CardBody>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Choose your AI agent', 'jetpack' ) }
						value={ selectedClient }
						options={ CLIENT_OPTIONS }
						onChange={ setSelectedClient }
					/>
				</CardBody>
			</Card>

			{ showQuickSetup && (
				<Card>
					<CardBody>
						<Stack direction="column" gap="md">
							<Text as="h3" weight={ 600 }>
								{ __( 'Quick setup', 'jetpack' ) }
							</Text>

							{ selectedClient === 'claude' && (
								<ol className="jetpack-ai-mcp-setup__steps">
									<li>
										<Text as="p" variant="muted">
											{ createInterpolateElement( __( 'Open <ClaudeSettings/>.', 'jetpack' ), {
												ClaudeSettings: (
													<Link
														href={ getRedirectUrl( CLAUDE_SETTINGS_CONNECTOR_REDIRECT_SOURCE ) }
														openInNewTab
													>
														{ __( 'Claude settings', 'jetpack' ) }
													</Link>
												),
											} ) }
										</Text>
									</li>
									<li>
										<Text as="p" variant="muted">
											{ __( 'Click "Browse connectors" and search for WordPress.com.', 'jetpack' ) }
										</Text>
									</li>
									<li>
										<Text as="p" variant="muted">
											{ __( 'Select WordPress.com and follow the prompts.', 'jetpack' ) }
										</Text>
									</li>
								</ol>
							) }

							{ selectedClient === 'claude-code' && (
								<Stack direction="column" gap="md">
									<Text as="p" variant="muted">
										{ __(
											'Claude Code uses a different config format with type: "http". Use the CLI or copy the configuration below.',
											'jetpack'
										) }
									</Text>
									<ul className="jetpack-ai-mcp-setup__steps">
										<li>
											<Text as="p" variant="muted">
												{ createInterpolateElement(
													__( 'Run in your terminal: <code/>', 'jetpack' ),
													{
														code: (
															<code className="jetpack-ai-mcp-setup__code">
																{ `claude mcp add --transport http ${ MCP_SERVER_NAME } ${ MCP_SERVER_URL }` }
															</code>
														),
													}
												) }
											</Text>
										</li>
										<li>
											<Text as="p" variant="muted">
												{ createInterpolateElement(
													__(
														'Or copy the configuration below and add it to your <mcpJson/> or <claudeJson/> file.',
														'jetpack'
													),
													{
														mcpJson: <code className="jetpack-ai-mcp-setup__code">.mcp.json</code>,
														claudeJson: (
															<code className="jetpack-ai-mcp-setup__code">~/.claude.json</code>
														),
													}
												) }
											</Text>
										</li>
										<li>
											<Text as="p" variant="muted">
												{ createInterpolateElement(
													__(
														'In Claude Code, run <code/> to authenticate with your WordPress.com account.',
														'jetpack'
													),
													{
														code: <code className="jetpack-ai-mcp-setup__code">/mcp</code>,
													}
												) }
											</Text>
										</li>
									</ul>
								</Stack>
							) }

							{ selectedClient === 'cursor' && (
								<Stack direction="column" gap="md">
									<Text as="p" variant="muted">
										{ __(
											'For Cursor users, use the one-click install to add the WordPress.com MCP app.',
											'jetpack'
										) }
									</Text>
									<Button
										variant="solid"
										className="jetpack-ai-mcp-setup__action-button"
										render={
											<a
												href="cursor://anysphere.cursor-deeplink/mcp/install?name=WordPress.com&config=eyJjb21tYW5kIjoibnB4IC15IG1jcC1yZW1vdGUgaHR0cHM6Ly9wdWJsaWMtYXBpLndvcmRwcmVzcy5jb20vd3Bjb20vdjIvbWNwL3YxIn0%3D"
												target="_blank"
												rel="noreferrer"
											/>
										}
									>
										{ __( 'Install in Cursor', 'jetpack' ) }
									</Button>
								</Stack>
							) }
						</Stack>
					</CardBody>
				</Card>
			) }

			<Card>
				<CardBody>
					<Stack direction="column" gap="sm">
						<Stack direction="row" justify="space-between" align="center">
							<Text as="h3" weight={ 600 }>
								{ __( 'Manual setup', 'jetpack' ) }
							</Text>
							<Button
								variant="minimal"
								tone="neutral"
								size="compact"
								onClick={ copyToClipboard }
								aria-label={ __( 'Copy configuration to clipboard', 'jetpack' ) }
							>
								<Icon icon={ copyStatus === 'success' ? check : copy } size={ 18 } />
							</Button>
						</Stack>
						<Text as="p" variant="muted">
							{ __( 'Copy this configuration into your client\u2019s MCP settings.', 'jetpack' ) }
						</Text>
						<TextareaControl
							className="jetpack-ai-mcp-setup__config-textarea"
							__nextHasNoMarginBottom
							value={ configText }
							onChange={ handleConfigChange }
							readOnly
						/>
						{ CLIENT_DOCS_SOURCES[ selectedClient ] && (
							<Link href={ getRedirectUrl( CLIENT_DOCS_SOURCES[ selectedClient ] ) } openInNewTab>
								{ CLIENT_DOCS_LABELS[ selectedClient ] }
							</Link>
						) }
					</Stack>
				</CardBody>
			</Card>
		</Stack>
	);
}
