/**
 * The AI agents offered on the connect card, and the MCP server details they share.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

export const MCP_SERVER_NAME = 'wpcom-mcp';
export const MCP_SERVER_URL = 'https://public-api.wordpress.com/wpcom/v2/mcp/v1';

export const CLAUDE_CODE_COMMAND = `claude mcp add --transport http ${ MCP_SERVER_NAME } ${ MCP_SERVER_URL }`;

// Each resolves to the client's connector or plugin page.
export const CLAUDE_CONNECTOR_REDIRECT_SOURCE = 'jetpack-ai-hub-mcp-setup-claude';
export const CLAUDE_SELF_HOSTED_REDIRECT_SOURCE = 'jetpack-ai-hub-mcp-setup-claude-self-hosted';
export const CHATGPT_CONNECTOR_REDIRECT_SOURCE = 'jetpack-ai-hub-mcp-setup-chatgpt';
export const CHATGPT_SELF_HOSTED_REDIRECT_SOURCE = 'jetpack-ai-hub-mcp-setup-chatgpt-self-hosted';
export const CURSOR_PLUGIN_REDIRECT_SOURCE = 'jetpack-ai-hub-mcp-setup-cursor';

export const VSCODE_INSTALL_URL = `https://vscode.dev/redirect/mcp/install?${ new URLSearchParams( {
	name: MCP_SERVER_NAME,
	config: JSON.stringify( { type: 'http', url: MCP_SERVER_URL } ),
} ) }`;

// English only: users paste it straight into an agent, so a translation could add instructions.
export const HELPER_PROMPT = `Connect yourself to my WordPress site over MCP. The server is ${ MCP_SERVER_URL }. Tell me what to click or run for this app, wait while I sign in with my WordPress.com account and approve the connection, then list my sites to confirm it works.`;

/**
 * Build the agent tiles. Each has either an `href` to open or `code` to copy.
 *
 * @return {Array<object>} Agent tiles, in display order.
 */
export function getConnectAgents() {
	const isSelfHosted = window?.jetpackAiSettings?.isSelfHosted === true;

	return [
		{
			key: 'chatgpt',
			name: 'ChatGPT',
			description: __( 'OpenAI’s chat app', 'jetpack' ),
			logo: 'chatgpt.svg',
			actionLabel: __( 'Add app', 'jetpack' ),
			href: getRedirectUrl(
				isSelfHosted ? CHATGPT_SELF_HOSTED_REDIRECT_SOURCE : CHATGPT_CONNECTOR_REDIRECT_SOURCE
			),
		},
		{
			key: 'claude',
			name: 'Claude',
			description: __( 'App and desktop', 'jetpack' ),
			logo: 'claude.svg',
			actionLabel: __( 'Add app', 'jetpack' ),
			href: getRedirectUrl(
				isSelfHosted ? CLAUDE_SELF_HOSTED_REDIRECT_SOURCE : CLAUDE_CONNECTOR_REDIRECT_SOURCE
			),
		},
		{
			key: 'claude-code',
			name: 'Claude Code',
			description: __( 'Run in your terminal, then use /mcp to sign in', 'jetpack' ),
			logo: 'claude-code.svg',
			actionLabel: __( 'Copy command', 'jetpack' ),
			code: CLAUDE_CODE_COMMAND,
		},
		{
			key: 'cursor',
			name: 'Cursor',
			description: __( 'From the Cursor Marketplace', 'jetpack' ),
			logo: 'cursor.svg',
			actionLabel: __( 'Add plugin', 'jetpack' ),
			href: getRedirectUrl( CURSOR_PLUGIN_REDIRECT_SOURCE ),
		},
		{
			key: 'vscode',
			name: 'VS Code',
			description: __( 'Opens VS Code to approve the server', 'jetpack' ),
			logo: 'vscode.svg',
			actionLabel: __( 'Add server', 'jetpack' ),
			href: VSCODE_INSTALL_URL,
		},
		{
			key: 'codex',
			name: 'Codex',
			description: __( 'Run in your terminal', 'jetpack' ),
			logo: 'openai.svg',
			actionLabel: __( 'Copy command', 'jetpack' ),
			code: `codex mcp add ${ MCP_SERVER_NAME } --url ${ MCP_SERVER_URL }`,
		},
		{
			key: 'antigravity',
			name: 'Antigravity',
			description: __( 'Paste into its agent chat', 'jetpack' ),
			logo: 'antigravity.svg',
			actionLabel: __( 'Copy prompt', 'jetpack' ),
			code: HELPER_PROMPT,
		},
		{
			key: 'mcp',
			name: __( 'Any MCP agent', 'jetpack' ),
			description: __( 'Any app that supports MCP', 'jetpack' ),
			logo: 'mcp.svg',
			actionLabel: __( 'Copy URL', 'jetpack' ),
			code: MCP_SERVER_URL,
		},
	];
}
