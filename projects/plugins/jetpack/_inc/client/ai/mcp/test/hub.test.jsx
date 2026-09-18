import { render, screen, within } from '@testing-library/react';
import McpHub from '../index';

// tracks.js imports the webpack-aliased 'lib/analytics', which does not
// resolve under jest; provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const mcpAbilities = siteLevelEnabled => ( {
	account: { some_tool: { title: 'Some tool', enabled: true, readonly: true } },
	sites: [ { blog_id: 1, site_level_enabled: siteLevelEnabled } ],
} );

const renderHub = ( { siteLevelEnabled = true } = {} ) =>
	render(
		<McpHub
			mcpAbilities={ mcpAbilities( siteLevelEnabled ) }
			blogId={ 1 }
			activityLogUrl="https://example.com/activity"
			savingToolIds={ new Set() }
			onNavigate={ jest.fn() }
			onUpdate={ jest.fn() }
		/>
	);

const COLUMNS = [
	[ 'Enable MCP', 'Give your AI agent access to the site and control what it can read and write.' ],
	[ 'Connect agent', 'Connect your agent of choice: Claude, ChatGPT, VS Code, and others.' ],
	[ 'Manage via chat', 'Create content, get reports, and manage your site from the conversation.' ],
];

describe( 'McpHub how-it-works card', () => {
	test( 'renders a region named by its heading with three titled columns', () => {
		renderHub();

		const region = screen.getByRole( 'region', { name: 'How it works' } );
		expect(
			within( region ).getByRole( 'heading', { name: 'How it works', level: 3 } )
		).toBeInTheDocument();
		for ( const [ title, sentence ] of COLUMNS ) {
			expect(
				within( region ).getByRole( 'heading', { name: title, level: 4 } )
			).toBeInTheDocument();
			expect( within( region ).getByText( sentence ) ).toBeInTheDocument();
		}
	} );

	test( 'is shown when MCP is on', () => {
		renderHub( { siteLevelEnabled: true } );

		expect( screen.getByRole( 'region', { name: 'How it works' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Enable MCP access' } ) ).toBeChecked();
	} );

	test( 'is shown when MCP is off', () => {
		renderHub( { siteLevelEnabled: false } );

		expect( screen.getByRole( 'region', { name: 'How it works' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Enable MCP access' } ) ).not.toBeChecked();
	} );

	test( 'sits before the access card in DOM order', () => {
		renderHub();

		const region = screen.getByRole( 'region', { name: 'How it works' } );
		const accessHeading = screen.getByRole( 'heading', { name: 'External AI agent access' } );
		expect( region.compareDocumentPosition( accessHeading ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );
} );
