import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import AllPlaylistsEdit from '../edit';
import type { AllPlaylistsAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

const apiFetchMock = apiFetch as unknown as jest.Mock;

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
	'<div class="wp-block-videopress-all-playlists videopress-all-playlists is-layout-gallery" data-playlist-total="2" data-video-total="9">Playlists</div>';

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
} );

describe( 'AllPlaylistsEdit', () => {
	it( 'renders the server-rendered markup with every setting sent along', async () => {
		apiFetchMock.mockResolvedValue( { rendered: RENDERED } );

		renderEdit( { layout: 'list', perPage: 4, pagination: 'load-more' } );

		expect( screen.getByRole( 'status', { name: 'Loading playlists…' } ) ).toBeInTheDocument();
		await expect( screen.findByText( 'Playlists' ) ).resolves.toBeInTheDocument();

		const path = decodeURIComponent( apiFetchMock.mock.calls[ 0 ][ 0 ].path );
		expect( path ).toContain( '/wp/v2/block-renderer/videopress/all-playlists' );
		expect( path ).toContain( 'attributes[layout]=list' );
		expect( path ).toContain( 'attributes[perPage]=4' );
		expect( path ).toContain( 'attributes[pagination]=load-more' );
	} );

	it( 'summarizes the index from the rendered markup', async () => {
		apiFetchMock.mockResolvedValue( { rendered: RENDERED } );

		renderEdit();

		await expect( screen.findByText( '2 playlists · 9 videos' ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the empty state when the site has no playlists', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );

		renderEdit();

		await expect( screen.findByText( 'No playlists yet' ) ).resolves.toBeInTheDocument();
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
