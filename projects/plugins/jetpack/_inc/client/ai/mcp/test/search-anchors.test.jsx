import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { splitViewAnchor } from '../anchors';
import McpRead from '../read';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const abilities = {
	account: {
		'wpcom-mcp/posts-list': {
			title: 'List posts',
			description: 'List posts for a site.',
			enabled: true,
			readonly: true,
			category: 'posts',
		},
		'wpcom-mcp/media-list': {
			title: 'List media',
			description: 'List the media library.',
			enabled: true,
			readonly: true,
			category: 'media',
		},
	},
	sites: [],
};

const renderRead = anchor =>
	render(
		<McpRead
			mcpAbilities={ abilities }
			blogId={ 123 }
			savingToolIds={ new Set() }
			onUpdate={ jest.fn() }
			anchor={ anchor }
		/>
	);

describe( 'MCP search and anchors', () => {
	beforeEach( () => {
		Object.defineProperty( Element.prototype, 'scrollIntoView', {
			configurable: true,
			value: jest.fn(),
		} );
	} );

	test( 'search opens groups and hides tools that do not match', async () => {
		renderRead();
		expect( screen.queryByRole( 'switch', { name: 'List posts' } ) ).not.toBeInTheDocument();

		await userEvent.type( screen.getByRole( 'searchbox' ), 'media' );

		expect( screen.getByRole( 'switch', { name: 'List media' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'switch', { name: 'List posts' } ) ).not.toBeInTheDocument();
	} );

	test( 'a tool anchor opens its group and scrolls to the tool, keeping other tools listed', async () => {
		renderRead( 'wpcom-mcp/posts-list' );

		await expect(
			screen.findByRole( 'switch', { name: 'List posts' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'searchbox' ) ).toHaveValue( '' );
		expect( Element.prototype.scrollIntoView ).toHaveBeenCalled();
		expect( screen.getByRole( 'switch', { name: 'List media' } ) ).toBeInTheDocument();
	} );
} );

describe( 'splitViewAnchor', () => {
	const views = [ 'mcp', 'mcp/read', 'mcp/write' ];
	const anchorViews = [ 'mcp/read', 'mcp/write' ];

	test.each( [
		[ 'mcp/read', 'mcp/read', null ],
		[ 'mcp/read/wpcom-mcp/posts-list', 'mcp/read', 'wpcom-mcp/posts-list' ],
		[ 'mcp/write/', 'mcp/write', null ],
		[ 'mcp/readme', null, null ],
	] )( '%s', ( path, view, anchor ) => {
		expect( splitViewAnchor( path, views, anchorViews ) ).toEqual( { view, anchor } );
	} );
} );
