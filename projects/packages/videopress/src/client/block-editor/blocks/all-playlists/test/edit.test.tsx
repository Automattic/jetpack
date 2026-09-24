import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import AllPlaylistsEdit from '../edit';
import { hydratePoster } from '../hydrate-poster';
import type { AllPlaylistsAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../hydrate-poster', () => ( {
	hydratePoster: jest.fn( () => Promise.resolve() ),
} ) );

// What useInnerBlocksProps was configured with on the last render.
let mockInnerBlocksOptions: Record< string, unknown > = {};

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	useInnerBlocksProps: ( props: Record< string, unknown >, options: Record< string, unknown > ) => {
		mockInnerBlocksOptions = options;
		return { ...props, 'data-testid': 'heading-inner-blocks' };
	},
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

const apiFetchMock = apiFetch as unknown as jest.Mock;
const hydratePosterMock = hydratePoster as unknown as jest.Mock;

const DEFAULT_ATTRIBUTES: AllPlaylistsAttributes = {
	layout: 'gallery',
	columns: 3,
	perPage: 6,
	orderBy: 'newest',
	showDescription: true,
	showVideoCount: true,
	showTotalRuntime: false,
	pagination: 'numbered',
};

const RENDERED =
	'<div class="wp-block-videopress-all-playlists videopress-all-playlists is-layout-gallery" data-playlist-total="2" data-video-total="9">' +
	'<div class="videopress-all-playlists__header"><h2 class="videopress-all-playlists__heading">Playlists</h2><span class="videopress-all-playlists__summary">2 playlists</span></div>' +
	'<ul class="videopress-all-playlists__items">' +
	'<li class="videopress-all-playlists__item is-poster-loading" data-page="1"><span data-guid="aaaaaaaa">Card one</span></li>' +
	'<li class="videopress-all-playlists__item is-poster-loading" data-page="2" hidden><span data-guid="bbbbbbbb">Card two</span></li>' +
	'</ul></div>';

/**
 * Render the edit component.
 *
 * @param overrides     - Attribute overrides.
 * @param setAttributes - setAttributes mock.
 */
function renderEdit(
	overrides: Partial< AllPlaylistsAttributes > = {},
	setAttributes: jest.Mock = jest.fn()
) {
	const props = {
		attributes: { ...DEFAULT_ATTRIBUTES, ...overrides },
		setAttributes,
		clientId: 'all-playlists-client-1',
	} as unknown as BlockEditProps< AllPlaylistsAttributes >;

	render( <AllPlaylistsEdit { ...props } /> );
}

beforeEach( () => {
	jest.clearAllMocks();
	mockInnerBlocksOptions = {};
} );

describe( 'AllPlaylistsEdit', () => {
	it( 'renders the server cards under the editable heading, with every setting sent along', async () => {
		apiFetchMock.mockResolvedValue( { rendered: RENDERED } );

		renderEdit( { layout: 'list', perPage: 4, pagination: 'load-more' } );

		expect( screen.getByRole( 'status', { name: 'Loading playlists…' } ) ).toBeInTheDocument();
		await expect( screen.findByText( 'Card one' ) ).resolves.toBeInTheDocument();

		// The heading is the inner block, not the server's fallback heading.
		expect( screen.getByTestId( 'heading-inner-blocks' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Playlists' ) ).not.toBeInTheDocument();
		expect( screen.getByText( '2 playlists' ) ).toBeInTheDocument();
		expect( mockInnerBlocksOptions.allowedBlocks ).toEqual( [ 'core/heading' ] );
		expect( mockInnerBlocksOptions.templateLock ).toBe( 'all' );
		expect( mockInnerBlocksOptions.template ).toEqual( [
			[ 'core/heading', { level: 2, content: 'Playlists' } ],
		] );

		const path = decodeURIComponent( apiFetchMock.mock.calls[ 0 ][ 0 ].path );
		expect( path ).toContain( '/wp/v2/block-renderer/videopress/all-playlists' );
		expect( path ).toContain( 'attributes[layout]=list' );
		expect( path ).toContain( 'attributes[perPage]=4' );
		expect( path ).toContain( 'attributes[pagination]=load-more' );
	} );

	it( 'resolves the posters of the visible cards in the canvas', async () => {
		apiFetchMock.mockResolvedValue( { rendered: RENDERED } );

		renderEdit();
		await expect( screen.findByText( 'Card one' ) ).resolves.toBeInTheDocument();

		await waitFor( () => expect( hydratePosterMock ).toHaveBeenCalledTimes( 1 ) );
		expect( hydratePosterMock.mock.calls[ 0 ][ 0 ] ).toHaveTextContent( 'Card one' );
	} );

	it( 'summarizes the index from the rendered markup', async () => {
		apiFetchMock.mockResolvedValue( { rendered: RENDERED } );

		renderEdit();

		await expect( screen.findByText( '2 playlists · 9 videos' ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the empty state, keeping the heading editable', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );

		renderEdit();

		await expect( screen.findByText( 'No playlists yet' ) ).resolves.toBeInTheDocument();
		expect( screen.getByTestId( 'heading-inner-blocks' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 playlists · 0 videos' ) ).toBeInTheDocument();
	} );

	it( 'shows the error state when rendering fails', async () => {
		apiFetchMock.mockRejectedValue( new Error( 'nope' ) );

		renderEdit();

		await expect(
			screen.findByText( 'The playlists could not be loaded' )
		).resolves.toBeInTheDocument();
	} );

	it( 'switches the layout and offers columns for the gallery only', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );
		const setAttributes = jest.fn();

		renderEdit( {}, setAttributes );
		await waitFor( () => expect( apiFetchMock ).toHaveBeenCalled() );

		expect( screen.getByRole( 'slider', { name: 'Columns' } ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'radio', { name: 'List' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'list' } );
	} );

	it( 'hides the columns control in the list layout', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );

		renderEdit( { layout: 'list' } );
		await waitFor( () => expect( apiFetchMock ).toHaveBeenCalled() );

		expect( screen.queryByRole( 'slider', { name: 'Columns' } ) ).not.toBeInTheDocument();
	} );

	it( 'clamps the playlists per page and sets the order and pagination', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );
		const setAttributes = jest.fn();

		renderEdit( {}, setAttributes );
		await waitFor( () => expect( apiFetchMock ).toHaveBeenCalled() );

		const perPage = screen.getByRole( 'spinbutton', { name: 'Playlists per page' } );
		await userEvent.clear( perPage );
		await userEvent.type( perPage, '99' );
		expect( setAttributes ).toHaveBeenLastCalledWith( { perPage: 48 } );

		await userEvent.selectOptions( screen.getByRole( 'combobox', { name: 'Order by' } ), 'title' );
		expect( setAttributes ).toHaveBeenLastCalledWith( { orderBy: 'title' } );

		await userEvent.click( screen.getByRole( 'radio', { name: '“Load more” button' } ) );
		expect( setAttributes ).toHaveBeenLastCalledWith( { pagination: 'load-more' } );
	} );
} );
