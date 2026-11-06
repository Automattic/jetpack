import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import McpSetup from '../setup';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const renderWithCursorSelected = async () => {
	render( <McpSetup /> );
	await userEvent.selectOptions(
		screen.getByRole( 'combobox', { name: 'Choose your AI agent' } ),
		'cursor'
	);
};

describe( 'McpSetup: Cursor quick setup', () => {
	test( 'links to the WordPress.com plugin on the Cursor Marketplace through the redirect source', async () => {
		await renderWithCursorSelected();

		expect( screen.getByRole( 'link', { name: /WordPress\.com plugin/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-ai-hub-mcp-setup-cursor' )
		);
	} );

	test( 'shows the /add-plugin chat command as the other install route', async () => {
		await renderWithCursorSelected();

		expect( screen.getByText( '/add-plugin wordpress-com' ) ).toBeInTheDocument();
	} );

	test( 'no longer offers the bare MCP server deeplink', async () => {
		await renderWithCursorSelected();

		expect( screen.queryByRole( 'link', { name: 'Install in Cursor' } ) ).not.toBeInTheDocument();
		expect(
			screen.queryAllByRole( 'link' ).map( link => link.getAttribute( 'href' ) )
		).not.toContainEqual( expect.stringMatching( /^cursor:\/\// ) );
	} );

	test( 'keeps the manual setup card for clients that cannot use the marketplace', async () => {
		await renderWithCursorSelected();

		expect( screen.getByRole( 'heading', { name: 'Manual setup' } ) ).toBeInTheDocument();
	} );
} );

describe( 'McpSetup: ChatGPT and Claude quick setup', () => {
	afterEach( () => {
		delete window.jetpackAiSettings;
	} );

	test.each( [
		[ 'chatgpt', true, 'WordPress plugin', 'jetpack-ai-hub-mcp-setup-chatgpt-self-hosted' ],
		[ 'chatgpt', false, 'WordPress plugin', 'jetpack-ai-hub-mcp-setup-chatgpt' ],
		[ 'chatgpt', undefined, 'WordPress plugin', 'jetpack-ai-hub-mcp-setup-chatgpt' ],
		[ 'claude', true, 'Claude connector', 'jetpack-ai-hub-mcp-setup-claude-self-hosted' ],
		[ 'claude', false, 'WordPress.com connector', 'jetpack-ai-hub-mcp-setup-claude' ],
		[ 'claude', undefined, 'WordPress.com connector', 'jetpack-ai-hub-mcp-setup-claude' ],
	] )( '%s with isSelfHosted %s links to the %s', async ( client, isSelfHosted, name, source ) => {
		window.jetpackAiSettings = { isSelfHosted };
		render( <McpSetup /> );
		await userEvent.selectOptions(
			screen.getByRole( 'combobox', { name: 'Choose your AI agent' } ),
			client
		);

		expect( screen.getByRole( 'link', { name: new RegExp( name ) } ) ).toHaveAttribute(
			'href',
			expect.stringMatching( new RegExp( `source=${ source }(&|$)` ) )
		);
	} );
} );

describe( 'McpSetup: manual configuration', () => {
	test( 'names the configuration field and gives Continue a keyed server entry', async () => {
		render( <McpSetup /> );
		await userEvent.selectOptions(
			screen.getByRole( 'combobox', { name: 'Choose your AI agent' } ),
			'continue'
		);

		const config = JSON.parse( screen.getByRole( 'textbox', { name: 'MCP configuration' } ).value );
		expect( config ).toEqual( {
			mcpServers: { 'wpcom-mcp': { url: 'https://public-api.wordpress.com/wpcom/v2/mcp/v1' } },
		} );
	} );
} );

describe( 'McpSetup: copy configuration', () => {
	test( 'announces a successful copy to screen readers', async () => {
		const user = userEvent.setup();
		const writeText = jest
			.spyOn( window.navigator.clipboard, 'writeText' )
			.mockResolvedValue( undefined );
		render( <McpSetup /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy configuration to clipboard' } ) );

		expect( writeText ).toHaveBeenCalled();
		expect( speak ).toHaveBeenCalledWith( 'Copied' );
	} );
} );
