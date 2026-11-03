import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import McpConnectAgents from '../connect-agents';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const renderCard = ( { isMcpEnabled = true, onNavigate = jest.fn() } = {} ) => {
	render( <McpConnectAgents isMcpEnabled={ isMcpEnabled } onNavigate={ onNavigate } /> );
	return { onNavigate };
};

// jsdom can't navigate, so stop a link and keep only the click.
const stopNavigation = link => link.addEventListener( 'click', event => event.preventDefault() );

beforeEach( () => {
	analytics.tracks.recordEvent.mockClear();
	window.jetpackAiSettings = {};
} );

afterEach( () => {
	delete window.jetpackAiSettings;
} );

describe( 'McpConnectAgents', () => {
	test( 'is a region named by its h2', () => {
		renderCard();

		const region = screen.getByRole( 'region', { name: 'Connect your AI agent' } );
		expect(
			within( region ).getByRole( 'heading', { name: 'Connect your AI agent', level: 2 } )
		).toBeInTheDocument();
	} );

	test.each( [
		[ 'Claude', 'https://claude.ai/directory/wordpress-com' ],
		[ 'ChatGPT', 'https://chatgpt.com/plugins/wordpress-com?open_in_app' ],
	] )( 'Connect %s opens its directory listing in a new tab, and says so', ( name, href ) => {
		renderCard();

		const link = screen.getByRole( 'link', {
			name: new RegExp( `^Connect ${ name }.*\\(opens in a new tab\\)` ),
		} );
		expect( link ).toHaveAttribute( 'href', href );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	test( 'a self-hosted site goes through the redirect service instead', () => {
		window.jetpackAiSettings.isSelfHosted = true;
		renderCard();

		expect( screen.getByRole( 'link', { name: /^Connect Claude/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'jetpack-ai-hub-overview-quick-start-claude-self-hosted' )
		);
	} );

	test.each( [
		[ 'Claude', 'claude' ],
		[ 'ChatGPT', 'chatgpt' ],
	] )( 'a click on Connect %s is recorded', async ( name, link ) => {
		renderCard();

		const button = screen.getByRole( 'link', { name: new RegExp( `^Connect ${ name }` ) } );
		stopNavigation( button );
		await userEvent.click( button );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_link_click',
			expect.objectContaining( { link_type: 'settings_connect', link } )
		);
	} );

	test( 'Other agents opens the setup sub-view in-app and is recorded', async () => {
		const { onNavigate } = renderCard();

		const link = screen.getByRole( 'link', { name: 'Other agents' } );
		expect( link ).toHaveAttribute( 'href', expect.stringMatching( /#\/mcp\/setup$/ ) );
		// The quieter link stays in this tab.
		expect( link ).not.toHaveAttribute( 'target' );
		expect( screen.getByText( /Claude Code, Cursor, VS Code, and more/ ) ).toBeInTheDocument();

		await userEvent.click( link );
		expect( onNavigate ).toHaveBeenCalledWith( 'setup' );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_link_click',
			expect.objectContaining( { link_type: 'settings_connect', link: 'other' } )
		);
	} );

	test( 'a modified click on Other agents is left to the browser', () => {
		const { onNavigate } = renderCard();

		const link = screen.getByRole( 'link', { name: 'Other agents' } );
		// fireEvent hands back whether the click went unprevented, which is
		// the point here; userEvent does not.
		// eslint-disable-next-line testing-library/prefer-user-event
		const notPrevented = fireEvent.click( link, { metaKey: true } );
		expect( notPrevented ).toBe( true );
		expect( onNavigate ).not.toHaveBeenCalled();
	} );

	test( 'with MCP access off, it points at the access switch first', () => {
		renderCard( { isMcpEnabled: false } );

		expect(
			screen.getByText( 'Turn on MCP access below, then connect your agent.' )
		).toBeInTheDocument();
		// The buttons stay: connecting works before access is on.
		expect( screen.getByRole( 'link', { name: /^Connect Claude/ } ) ).toBeInTheDocument();
	} );
} );
