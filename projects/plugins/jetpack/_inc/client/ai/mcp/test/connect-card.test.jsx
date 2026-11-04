import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import {
	CLAUDE_CODE_COMMAND,
	getConnectAgents,
	HELPER_PROMPT,
	MCP_SERVER_NAME,
	MCP_SERVER_URL,
} from '../connect-agents';
import McpConnectCard from '../connect-card';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const renderCard = ( props = {} ) => {
	const onNavigate = jest.fn();
	const onTurnOn = jest.fn();
	const view = render(
		<McpConnectCard
			mcpEnabled
			onTurnOn={ onTurnOn }
			isTurningOn={ false }
			onNavigate={ onNavigate }
			{ ...props }
		/>
	);
	const rerender = nextProps =>
		view.rerender(
			<McpConnectCard
				mcpEnabled
				onTurnOn={ onTurnOn }
				isTurningOn={ false }
				onNavigate={ onNavigate }
				{ ...props }
				{ ...nextProps }
			/>
		);
	return { onNavigate, onTurnOn, rerender };
};

// speak() copies announcements into a hidden live region, so skip it when matching text.
const NOT_SPOKEN = { ignore: 'script, style, .a11y-speak-region' };

// userEvent.setup() installs its own clipboard stub, so spy after it.
const setupClipboard = ( writeText = jest.fn().mockResolvedValue() ) => {
	const user = userEvent.setup();
	jest.spyOn( window.navigator.clipboard, 'writeText' ).mockImplementation( writeText );
	return { user, writeText };
};

describe( 'McpConnectCard', () => {
	beforeEach( () => analytics.tracks.recordEvent.mockClear() );
	afterEach( () => {
		delete window.jetpackAiSettings;
		jest.restoreAllMocks();
	} );

	test.each( [
		[ 'ChatGPT', true, 'jetpack-ai-hub-mcp-setup-chatgpt-self-hosted' ],
		[ 'ChatGPT', false, 'jetpack-ai-hub-mcp-setup-chatgpt' ],
		[ 'Claude', true, 'jetpack-ai-hub-mcp-setup-claude-self-hosted' ],
		[ 'Claude', false, 'jetpack-ai-hub-mcp-setup-claude' ],
	] )( '%s with isSelfHosted %s links to the %s redirect', ( name, isSelfHosted, source ) => {
		window.jetpackAiSettings = { isSelfHosted };
		renderCard();

		expect( screen.getByRole( 'link', { name } ) ).toHaveAttribute(
			'href',
			expect.stringMatching( new RegExp( `source=${ source }(&|$)` ) )
		);
	} );

	test( 'a tile is named by the agent and described by the rest', () => {
		renderCard();

		expect( screen.getByRole( 'button', { name: 'Claude Code' } ) ).toHaveAccessibleDescription(
			'Run in your terminal, then use /mcp to sign in Copy command'
		);
		expect( screen.getByRole( 'link', { name: 'VS Code' } ) ).toHaveAccessibleDescription(
			'Opens VS Code to approve the server Add server'
		);
	} );

	test( 'the VS Code link opens the install page with the server config', () => {
		renderCard();

		const link = screen.getByRole( 'link', { name: 'VS Code' } );
		const url = new URL( link.getAttribute( 'href' ) );

		expect( url.origin + url.pathname ).toBe( 'https://vscode.dev/redirect/mcp/install' );
		expect( url.searchParams.get( 'name' ) ).toBe( MCP_SERVER_NAME );
		expect( JSON.parse( url.searchParams.get( 'config' ) ) ).toEqual( {
			type: 'http',
			url: MCP_SERVER_URL,
		} );
	} );

	test( 'only the Claude Code, Cursor, Codex, Antigravity and MCP tiles copy', () => {
		const copyKeys = getConnectAgents()
			.filter( agent => agent.code )
			.map( agent => agent.key );

		expect( copyKeys ).toEqual( [ 'claude-code', 'cursor', 'codex', 'antigravity', 'mcp' ] );
	} );

	test( 'a copy tile copies its command, shows Copied, and records the copy', async () => {
		const { user, writeText } = setupClipboard();
		renderCard();

		const button = screen.getByRole( 'button', { name: 'Claude Code' } );
		await user.click( button );

		await waitFor( () => expect( within( button ).getByText( 'Copied' ) ).toBeInTheDocument() );
		expect( writeText ).toHaveBeenCalledWith( CLAUDE_CODE_COMMAND );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_mcp_connect_click',
			expect.objectContaining( { agent: 'claude-code', action: 'copy' } )
		);
	} );

	test( 'a failed copy records nothing and does not show Copied', async () => {
		const { user, writeText } = setupClipboard(
			jest.fn().mockRejectedValue( new Error( 'denied' ) )
		);
		renderCard();

		const button = screen.getByRole( 'button', { name: 'Codex' } );
		await user.click( button );

		await waitFor( () => expect( writeText ).toHaveBeenCalled() );
		expect( within( button ).queryByText( 'Copied' ) ).not.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );

	test( 'Copy prompt copies the helper prompt and records it', async () => {
		const { user, writeText } = setupClipboard();
		renderCard();

		await user.click( screen.getByRole( 'button', { name: 'Copy prompt' } ) );

		await waitFor( () => expect( writeText ).toHaveBeenCalledWith( HELPER_PROMPT ) );
		expect( HELPER_PROMPT ).toContain( MCP_SERVER_URL );
		await waitFor( () =>
			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_mcp_connect_helper_copy',
				expect.anything()
			)
		);
	} );

	test( 'the off notice shows only when MCP is off, and turns it on', async () => {
		const { onTurnOn } = renderCard( { mcpEnabled: false } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Turn on MCP access' } ) );

		expect( onTurnOn ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'no notice shows when MCP is already on', () => {
		renderCard();

		expect( screen.queryByText( 'MCP access is off' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'MCP access is on' ) ).not.toBeInTheDocument();
	} );

	test( 'turning MCP on replaces the off notice with an on notice that can be dismissed', async () => {
		const { rerender } = renderCard( { mcpEnabled: false } );

		rerender( { mcpEnabled: true } );

		expect( screen.queryByText( 'MCP access is off', NOT_SPOKEN ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'MCP access is on', NOT_SPOKEN ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( screen.queryByText( 'MCP access is on', NOT_SPOKEN ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Connect an external AI agent' } ) ).toHaveFocus();
	} );

	test( 'Manual setup opens the setup view', async () => {
		const { onNavigate } = renderCard();

		await userEvent.click( screen.getByRole( 'button', { name: 'Manual setup' } ) );

		expect( onNavigate ).toHaveBeenCalledWith( 'setup' );
	} );

	test( 'a logo that fails to load falls back to the first letter', () => {
		window.jetpackAiSettings = { pluginUrl: 'https://example.com/jetpack' };
		renderCard();

		// eslint-disable-next-line testing-library/no-node-access -- logos are hidden from the a11y tree by design.
		const logos = document.querySelectorAll( '.jetpack-ai-mcp__connect-logo img' );
		expect( logos ).toHaveLength( 8 );
		expect( logos[ 0 ] ).toHaveAttribute(
			'src',
			'https://example.com/jetpack/images/ai-hub/agents/chatgpt.svg'
		);

		fireEvent.error( logos[ 0 ] );

		const [ chatgpt ] = screen.getAllByRole( 'listitem' );
		expect( within( chatgpt ).getByText( 'C' ) ).toBeInTheDocument();
	} );
} );
