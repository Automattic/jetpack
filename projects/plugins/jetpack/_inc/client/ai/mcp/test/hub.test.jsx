import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import McpHub from '../index';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const mcpAbilities = siteLevelEnabled => ( {
	account: {
		some_tool: { title: 'Some tool', enabled: true, readonly: true },
		write_tool: { title: 'Write tool', enabled: false, readonly: false },
		opt_in_tool: { enabled: false, requires_opt_in: true },
		hidden_tool: { enabled: false, visible: false },
	},
	sites: [ { blog_id: 1, site_level_enabled: siteLevelEnabled } ],
} );

const renderHub = ( { siteLevelEnabled = true, activityLogFiltered = false } = {} ) =>
	render(
		<McpHub
			mcpAbilities={ mcpAbilities( siteLevelEnabled ) }
			blogId={ 1 }
			activityLogUrl="https://example.com/activity"
			activityLogFiltered={ activityLogFiltered }
			savingToolIds={ new Set() }
			onNavigate={ jest.fn() }
			onUpdate={ jest.fn() }
		/>
	);

describe( 'McpHub connect card', () => {
	test( 'summary badge uses the API state for an opt-in tool with no override', () => {
		render(
			<McpHub
				mcpAbilities={ {
					account: {
						read: { readonly: true, enabled: true },
						read_opt_in: { readonly: true, enabled: false, requires_opt_in: true },
					},
					site_level_enabled_default: true,
				} }
				blogId={ 1 }
				savingToolIds={ new Set() }
				onNavigate={ jest.fn() }
				onUpdate={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'button', { name: /Read/ } ) ).toHaveTextContent( '1 of 2 enabled' );
	} );

	test( 'sits above the access card, and replaces the setup row', () => {
		renderHub();

		const connect = screen.getByRole( 'heading', { name: 'Connect an external AI agent' } );
		const accessHeading = screen.getByRole( 'heading', { name: 'External AI agent access' } );
		expect( connect.compareDocumentPosition( accessHeading ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(
			screen.queryByRole( 'button', { name: 'Connect external AI agent' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'region', { name: 'How it works' } ) ).not.toBeInTheDocument();
	} );

	test( 'Turn on MCP access saves the same update as the toggle', async () => {
		const onUpdate = jest.fn();
		render(
			<McpHub
				mcpAbilities={ mcpAbilities( false ) }
				blogId={ 1 }
				savingToolIds={ new Set() }
				onNavigate={ jest.fn() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Turn on MCP access' } ) );

		expect( onUpdate ).toHaveBeenCalledWith( {
			sites: [ { blog_id: 1, site_level_enabled: true, abilities: { some_tool: true } } ],
		} );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_mcp_enabled_toggled',
			expect.objectContaining( { enabled: true, source: 'connect_notice' } )
		);
	} );

	test( 'the toggle records its own source', async () => {
		analytics.tracks.recordEvent.mockClear();
		const onUpdate = jest.fn();
		render(
			<McpHub
				mcpAbilities={ mcpAbilities( false ) }
				blogId={ 1 }
				savingToolIds={ new Set() }
				onNavigate={ jest.fn() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Enable MCP access' } ) );

		expect( onUpdate ).toHaveBeenCalledWith( {
			sites: [ { blog_id: 1, site_level_enabled: true, abilities: { some_tool: true } } ],
		} );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_mcp_enabled_toggled',
			expect.objectContaining( { enabled: true, source: 'toggle' } )
		);
	} );
} );

describe( 'McpHub activity log row', () => {
	test( 'promises AI agent actions when the link is filtered', () => {
		renderHub( { activityLogFiltered: true } );

		expect(
			screen.getByText( 'Review recent actions taken by AI agents on your site.' )
		).toBeInTheDocument();
	} );

	test( 'describes all actions when the link is not filtered', () => {
		renderHub();

		expect( screen.getByText( 'Review recent actions on your site.' ) ).toBeInTheDocument();
	} );
} );

describe( 'McpHub activity log tracks', () => {
	test( 'a click records whether the link is filtered', async () => {
		renderHub( { activityLogFiltered: false } );

		const link = screen.getByRole( 'link', { name: /Activity log/ } );
		// jsdom can't navigate, so stop the link and keep only the click.
		link.addEventListener( 'click', event => event.preventDefault() );
		await userEvent.click( link );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_link_click',
			expect.not.objectContaining( { view: expect.anything() } )
		);
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_link_click',
			expect.objectContaining( {
				link_type: 'activity_log',
				link: 'activity_log',
				filtered: 'false',
			} )
		);
	} );
} );
