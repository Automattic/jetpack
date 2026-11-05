import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import analytics from 'lib/analytics';
import {
	CLAUDE_CODE_COMMAND,
	getConnectAgents,
	HELPER_PROMPT,
	MCP_SERVER_URL,
} from '../connect-agents';
import McpConnectCard from '../connect-card';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const renderCard = ( props = {} ) => {
	const onNavigate = jest.fn();
	const onTurnOn = jest.fn();
	render(
		<McpConnectCard
			mcpEnabled
			onTurnOn={ onTurnOn }
			isTurningOn={ false }
			onNavigate={ onNavigate }
			{ ...props }
		/>
	);
	return { onNavigate, onTurnOn };
};

// userEvent.setup() installs its own clipboard stub, so spy after it.
const setupClipboard = ( writeText = jest.fn().mockResolvedValue() ) => {
	const user = userEvent.setup();
	jest.spyOn( window.navigator.clipboard, 'writeText' ).mockImplementation( writeText );
	return { user, writeText };
};

describe( 'McpConnectCard', () => {
	beforeEach( () => {
		analytics.tracks.recordEvent.mockClear();
		speak.mockClear();
	} );
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

	test.each( [
		[ 'Cursor', 'jetpack-ai-hub-mcp-setup-cursor' ],
		[ 'VS Code', 'jetpack-ai-hub-mcp-setup-vscode' ],
	] )( '%s links to the %s redirect', ( name, source ) => {
		renderCard();

		expect( screen.getByRole( 'link', { name } ) ).toHaveAttribute(
			'href',
			expect.stringMatching(
				new RegExp( `^https://jetpack\\.com/redirect/\\?source=${ source }(&|$)` )
			)
		);
	} );

	test( 'a tile is named by the agent and described by the rest', () => {
		renderCard();

		expect( screen.getByRole( 'button', { name: 'Claude Code' } ) ).toHaveAccessibleDescription(
			'Run in your terminal, then use /mcp to sign in Copy command'
		);
		expect( screen.getByRole( 'link', { name: 'VS Code' } ) ).toHaveAccessibleDescription(
			'Opens VS Code to approve the server Add server (opens in a new tab)'
		);
	} );

	test( 'a link tile records the open', async () => {
		renderCard();

		await userEvent.click( screen.getByRole( 'link', { name: 'Cursor' } ) );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_mcp_connect_click',
			expect.objectContaining( { agent: 'cursor', action: 'open' } )
		);
	} );

	test( 'only the Claude Code, Codex, Antigravity and MCP tiles copy', () => {
		const copyKeys = getConnectAgents()
			.filter( agent => agent.code )
			.map( agent => agent.key );

		expect( copyKeys ).toEqual( [ 'claude-code', 'codex', 'antigravity', 'mcp' ] );
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

	test( 'a failed copy records nothing, does not show Copied, and shows the text selected', async () => {
		const { user, writeText } = setupClipboard(
			jest.fn().mockRejectedValueOnce( new Error( 'denied' ) ).mockResolvedValue()
		);
		renderCard();

		const button = screen.getByRole( 'button', { name: 'Codex' } );
		await user.click( button );

		const field = await screen.findByRole( 'textbox', { name: 'Your browser blocked copying' } );
		expect( field ).toHaveAccessibleDescription( 'Press Ctrl+C or ⌘C to copy this text.' );
		expect( field ).toHaveValue( getConnectAgents().find( agent => agent.key === 'codex' ).code );
		expect( field ).toHaveFocus();
		expect( field.selectionStart ).toBe( 0 );
		expect( field.selectionEnd ).toBe( field.value.length );
		expect( writeText ).toHaveBeenCalledTimes( 1 );
		expect( within( button ).queryByText( 'Copied' ) ).not.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();

		// A copy that works removes the field.
		await user.click( screen.getByRole( 'button', { name: 'Claude Code' } ) );

		await waitFor( () =>
			expect(
				screen.queryByRole( 'textbox', { name: 'Your browser blocked copying' } )
			).not.toBeInTheDocument()
		);
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

	test( 'says MCP access is on once turning it on saves', () => {
		const props = { onTurnOn: jest.fn(), isTurningOn: false, onNavigate: jest.fn() };
		const { rerender } = render( <McpConnectCard mcpEnabled={ false } { ...props } /> );

		expect( speak ).not.toHaveBeenCalled();
		rerender( <McpConnectCard mcpEnabled { ...props } /> );

		expect( speak ).toHaveBeenCalledWith( 'MCP access is on' );
	} );

	test( 'moves focus to the first tile when Turn on MCP access disappears', async () => {
		const props = { onTurnOn: jest.fn(), isTurningOn: false, onNavigate: jest.fn() };
		const { rerender } = render( <McpConnectCard mcpEnabled={ false } { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Turn on MCP access' } ) );
		rerender( <McpConnectCard mcpEnabled { ...props } /> );

		expect( screen.getByRole( 'link', { name: 'ChatGPT' } ) ).toHaveFocus();
	} );

	test( 'leaves focus on the page when the toggle turns MCP access on', () => {
		const props = { onTurnOn: jest.fn(), isTurningOn: false, onNavigate: jest.fn() };
		const { rerender } = render( <McpConnectCard mcpEnabled={ false } { ...props } /> );

		// The toggle disables while saving, which drops focus to the body.
		rerender( <McpConnectCard mcpEnabled { ...props } /> );

		expect( document.body ).toHaveFocus();
	} );

	test( 'keeps focus where it is when MCP access turns on from elsewhere', () => {
		const props = { onTurnOn: jest.fn(), isTurningOn: false, onNavigate: jest.fn() };
		const { rerender } = render( <McpConnectCard mcpEnabled={ false } { ...props } /> );

		const manualSetup = screen.getByRole( 'button', { name: 'Manual setup' } );
		manualSetup.focus();
		rerender( <McpConnectCard mcpEnabled { ...props } /> );

		expect( manualSetup ).toHaveFocus();
	} );

	test( 'the off notice is hidden when MCP is on', () => {
		renderCard();

		expect( screen.queryByText( 'MCP access is off' ) ).not.toBeInTheDocument();
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
