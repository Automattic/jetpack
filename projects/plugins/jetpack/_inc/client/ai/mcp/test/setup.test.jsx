import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import McpSetup from '../setup';

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
