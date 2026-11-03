/**
 * The AI agents offered on the connect card, and the MCP server details they share.
 */

import { __ } from '@wordpress/i18n';

export const MCP_SERVER_NAME = 'wpcom-mcp';
export const MCP_SERVER_URL = 'https://public-api.wordpress.com/wpcom/v2/mcp/v1';

export const HELPER_PROMPT = `Connect yourself to my WordPress site over MCP. The server is ${ MCP_SERVER_URL }. Tell me what to click or run for this app, wait while I sign in with my WordPress.com account and approve the connection, then list my sites to confirm it works.`;

/**
 * Build the agent tiles. Each has either an `href` to open or `code` to copy.
 *
 * @return {Array<object>} Agent tiles, in display order.
 */
export function getConnectAgents() {
	return [
		{
			key: 'chatgpt',
			name: 'ChatGPT',
			description: __( 'OpenAI’s chat app', 'jetpack' ),
			logo: 'chatgpt.svg',
			actionLabel: __( 'Add app', 'jetpack' ),
			href: 'https://wp.me/chatgpt',
		},
		{
			key: 'claude',
			name: 'Claude',
			description: __( 'App and desktop', 'jetpack' ),
			logo: 'claude.svg',
			actionLabel: __( 'Add app', 'jetpack' ),
			href: 'https://wp.me/claude',
		},
		{
			key: 'claude-code',
			name: 'Claude Code',
			description: __( 'Run in your terminal, then use /mcp to sign in', 'jetpack' ),
			logo: 'claude-code.svg',
			actionLabel: __( 'Copy command', 'jetpack' ),
			code: `claude mcp add --transport http ${ MCP_SERVER_NAME } ${ MCP_SERVER_URL }`,
		},
		{
			key: 'cursor',
			name: 'Cursor',
			description: __( 'Run in Cursor’s chat', 'jetpack' ),
			logo: 'cursor.svg',
			actionLabel: __( 'Copy command', 'jetpack' ),
			code: '/add-plugin wordpress-com',
		},
		{
			key: 'vscode',
			name: 'VS Code',
			description: __( 'Run in your terminal, then approve in VS Code', 'jetpack' ),
			logo: 'vscode.svg',
			actionLabel: __( 'Copy command', 'jetpack' ),
			// Percent-encoded because `code --add-mcp` takes raw JSON, which no single quoting works for in every shell.
			code: `code --open-url "vscode:mcp/install?${ encodeURIComponent(
				JSON.stringify( { name: MCP_SERVER_NAME, type: 'http', url: MCP_SERVER_URL } )
			) }"`,
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
