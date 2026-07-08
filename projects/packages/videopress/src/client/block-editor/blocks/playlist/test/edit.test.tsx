import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getApiFetchMock, mockApiFetch } from '../../../../../dashboard/test-utils/mock-api-fetch';
import PlaylistEdit from '../edit';
import type { PlaylistBlockAttributes } from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props = {} ) => props,
	InspectorControls: ( { children } ) => <div data-testid="inspector-controls">{ children }</div>,
	BlockIcon: () => null,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Placeholder: ( { label, instructions, children } ) => (
		<div data-testid="placeholder">
			<div>{ label }</div>
			{ instructions ? <div>{ instructions }</div> : null }
			{ children }
		</div>
	),
	Spinner: () => <span data-testid="spinner" />,
	PanelBody: ( { title, children } ) => (
		<section>
			<h2>{ title }</h2>
			{ children }
		</section>
	),
	ComboboxControl: ( { label, value, options, onChange } ) => (
		<select
			aria-label={ label }
			value={ value }
			onChange={ event => onChange( event.target.value ) }
		>
			<option value="" />
			{ options.map( option => (
				<option key={ option.value } value={ option.value }>
					{ option.label }
				</option>
			) ) }
		</select>
	),
	SelectControl: ( { label, value, options, onChange } ) => (
		<select
			aria-label={ label }
			value={ value }
			onChange={ event => onChange( event.target.value ) }
		>
			{ options.map( option => (
				<option key={ option.value } value={ option.value }>
					{ option.label }
				</option>
			) ) }
		</select>
	),
	ToggleControl: ( { label, checked, onChange } ) => (
		// eslint-disable-next-line jsx-a11y/label-has-associated-control -- test mock
		<label>
			<input type="checkbox" checked={ checked } onChange={ () => onChange( ! checked ) } />
			{ label }
		</label>
	),
	SVG: ( { children } ) => <svg>{ children }</svg>,
	Path: () => <path />,
} ) );

// Raw /wp/v2/videopress-playlists terms, as the core terms controller returns
// them (meta rides under the registered keys).
const rawPlaylists = [
	{
		id: 7,
		name: 'Summer clips',
		description: 'Warm weather footage',
		count: 2,
		meta: { vps_playlist_artwork_id: 0, vps_playlist_order: [ 21, 20 ] },
	},
	{
		id: 8,
		name: 'With artwork',
		description: '',
		count: 2,
		meta: { vps_playlist_artwork_id: 55, vps_playlist_order: [] },
	},
	{ id: 9, name: 'Tutorials', description: '', count: 0, meta: {} },
	{
		id: 10,
		name: 'Video artwork',
		description: '',
		count: 2,
		meta: { vps_playlist_artwork_id: 56, vps_playlist_order: [] },
	},
];

// Raw /wp/v2/media members for playlist 7, in the request's date-desc order.
// The stored order [ 21, 20 ] reverses them.
const rawMedia = [
	{
		id: 20,
		title: { rendered: 'Newest video' },
		media_details: {
			videopress: { poster: 'https://example.com/poster-20.jpg', duration: 65000 },
		},
	},
	{
		id: 21,
		title: { rendered: 'Oldest video' },
		media_details: {
			videopress: { poster: 'https://example.com/poster-21.jpg', duration: 130000 },
		},
	},
];

const rawArtwork = {
	id: 55,
	media_type: 'image',
	source_url: 'https://example.com/artwork-full.jpg',
	media_details: {
		sizes: { medium: { source_url: 'https://example.com/artwork-medium.jpg' } },
	},
};

// A VIDEO chosen as artwork: no image sizes; resolution must use its
// VideoPress poster, never source_url (the video file itself).
const rawVideoArtwork = {
	id: 56,
	media_type: 'file',
	mime_type: 'video/videopress',
	source_url: 'https://videos.files.wordpress.com/abc123/video.mov',
	media_details: {
		videopress: { poster: 'https://example.com/video-artwork-poster.jpg' },
	},
};

/**
 * Install an apiFetch handler covering the block's three routes.
 *
 * @return {jest.Mock} The apiFetch mock, for call assertions.
 */
function mockRoutes() {
	return mockApiFetch( async ( { path } ) => {
		if ( path?.startsWith( '/wp/v2/videopress-playlists' ) ) {
			return rawPlaylists;
		}
		if ( path?.startsWith( '/wp/v2/media?' ) ) {
			const playlistId = new URLSearchParams( path.split( '?' )[ 1 ] ).get(
				'videopress-playlists'
			);
			return [ '7', '8', '10' ].includes( playlistId ?? '' ) ? rawMedia : [];
		}
		if ( path === '/wp/v2/media/55' ) {
			return rawArtwork;
		}
		if ( path === '/wp/v2/media/56' ) {
			return rawVideoArtwork;
		}
		throw new Error( `Unexpected path: ${ path }` );
	} );
}

/**
 * Render the edit component with sensible attribute defaults.
 *
 * @param {object} attributes - Attribute overrides.
 * @return {object} Testing-library render result plus the setAttributes mock.
 */
function renderEdit( attributes: Partial< PlaylistBlockAttributes > = {} ) {
	const setAttributes = jest.fn();
	const utils = render(
		<PlaylistEdit
			attributes={ { layout: 'list', showHeader: true, autoplayNext: true, ...attributes } }
			setAttributes={ setAttributes }
		/>
	);
	return { ...utils, setAttributes };
}

describe( 'PlaylistEdit', () => {
	it( 'shows a loading state while playlists load', () => {
		mockApiFetch( () => new Promise( () => {} ) );

		renderEdit();

		expect( screen.getByText( 'Loading playlists…' ) ).toBeInTheDocument();
	} );

	it( 'shows a permission error when the playlists request is forbidden', async () => {
		mockApiFetch( async () => {
			throw { code: 'rest_forbidden', data: { status: 403 } };
		} );

		renderEdit();

		await expect( screen.findByText( /do not have permission/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows a generic error when the playlists request fails', async () => {
		mockApiFetch( async () => {
			throw { code: 'internal_server_error', data: { status: 500 } };
		} );

		renderEdit();

		await expect(
			screen.findByText( 'The playlists could not be loaded. Reload the editor to try again.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'offers the playlist picker when nothing is selected', async () => {
		mockRoutes();

		const { setAttributes } = renderEdit();

		// One picker in the placeholder, one in the inspector sidebar.
		const pickers = await screen.findAllByLabelText( 'Playlist' );
		expect( pickers ).toHaveLength( 2 );

		await userEvent.selectOptions( pickers[ 0 ], '7' );
		expect( setAttributes ).toHaveBeenCalledWith( { playlistId: 7 } );
	} );

	it( 'points at the dashboard when the site has no playlists', async () => {
		mockApiFetch( async () => [] );

		renderEdit();

		await expect( screen.findByText( /No playlists found/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders the selected playlist preview in the resolved order', async () => {
		const apiFetchMock = mockRoutes();

		renderEdit( { playlistId: 7 } );

		await expect( screen.findByText( 'Oldest video' ) ).resolves.toBeInTheDocument();

		// Stored order [ 21, 20 ] wins over the date-desc fetch order
		// [ 20, 21 ], and durations are formatted like the server render.
		const items = screen.getAllByRole( 'listitem' );
		expect( items ).toHaveLength( 2 );
		expect( items[ 0 ] ).toHaveTextContent( 'Oldest video' );
		expect( items[ 0 ] ).toHaveTextContent( '2:10' );
		expect( items[ 1 ] ).toHaveTextContent( 'Newest video' );
		expect( items[ 1 ] ).toHaveTextContent( '1:05' );

		// Members were requested exactly like the dashboard fetch.
		expect( apiFetchMock ).toHaveBeenCalledWith( {
			path: '/wp/v2/media?videopress-playlists=7&per_page=100&orderby=date&order=desc',
		} );
	} );

	it( 'renders the header with the count and the first-poster artwork fallback', async () => {
		mockRoutes();

		renderEdit( { playlistId: 7 } );

		await expect( screen.findByText( 'Warm weather footage' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '2 videos' ) ).toBeInTheDocument();

		// No artwork set: falls back to the first ordered video's poster. The
		// artwork img is decorative (alt="", role presentation) and renders
		// before the equally decorative item posters.
		const decorativeImages = screen.getAllByRole( 'presentation' );
		expect( decorativeImages[ 0 ] ).toHaveAttribute( 'src', 'https://example.com/poster-21.jpg' );
	} );

	it( 'resolves the artwork attachment for the header', async () => {
		mockRoutes();

		renderEdit( { playlistId: 8 } );

		await expect( screen.findByText( 'Oldest video' ) ).resolves.toBeInTheDocument();

		const decorativeImages = screen.getAllByRole( 'presentation' );
		expect( decorativeImages[ 0 ] ).toHaveAttribute(
			'src',
			'https://example.com/artwork-medium.jpg'
		);
		expect( getApiFetchMock() ).toHaveBeenCalledWith( { path: '/wp/v2/media/55' } );
	} );

	it( 'resolves a video artwork attachment to its poster, never the file URL', async () => {
		mockRoutes();

		renderEdit( { playlistId: 10 } );

		// Wait for the member rows too, so every pending fetch has settled
		// before the test ends (avoids un-act()ed late state updates).
		await expect( screen.findByText( 'Newest video' ) ).resolves.toBeInTheDocument();
		await waitFor( () => {
			const decorativeImages = screen.getAllByRole( 'presentation' );
			expect( decorativeImages[ 0 ] ).toHaveAttribute(
				'src',
				'https://example.com/video-artwork-poster.jpg'
			);
		} );
	} );

	it( 'hides the header when showHeader is off', async () => {
		mockRoutes();

		renderEdit( { playlistId: 7, showHeader: false } );

		await expect( screen.findByText( 'Oldest video' ) ).resolves.toBeInTheDocument();

		// Description and count only ever render inside the header.
		expect( screen.queryByText( 'Warm weather footage' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '2 videos' ) ).not.toBeInTheDocument();
	} );

	it( 'decodes HTML entities in video titles and playlist names', async () => {
		// title.rendered arrives entity-encoded from the REST API (the_title
		// filters), and term names/descriptions can carry entities too; React
		// escapes on output, so the preview must decode first.
		mockApiFetch( async ( { path } ) => {
			if ( path?.startsWith( '/wp/v2/videopress-playlists' ) ) {
				return [
					{
						id: 7,
						name: 'Cats &amp; Dogs',
						description: 'Fur &amp; feathers',
						count: 1,
						meta: { vps_playlist_artwork_id: 0, vps_playlist_order: [] },
					},
				];
			}
			if ( path?.startsWith( '/wp/v2/media?' ) ) {
				return [
					{
						id: 20,
						title: { rendered: 'Cats &#038; Dogs, part 1' },
						media_details: { videopress: { poster: '', duration: 65000 } },
					},
				];
			}
			throw new Error( `Unexpected path: ${ path }` );
		} );

		renderEdit( { playlistId: 7 } );

		// Item title, header name (also a picker option label), description.
		await expect( screen.findByText( 'Cats & Dogs, part 1' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( 'Cats & Dogs' ) ).not.toHaveLength( 0 );
		expect( screen.getByText( 'Fur & feathers' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'option', { name: 'Cats & Dogs' } ) ).toBeInTheDocument();
		expect( screen.queryByText( /&amp;|&#038;/ ) ).not.toBeInTheDocument();
	} );

	it( 'flags a selected playlist that no longer exists', async () => {
		mockRoutes();

		renderEdit( { playlistId: 999 } );

		await expect( screen.findByText( /no longer exists/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'explains an empty playlist instead of rendering an empty preview', async () => {
		mockRoutes();

		renderEdit( { playlistId: 9 } );

		await expect( screen.findByText( /has no videos yet/ ) ).resolves.toBeInTheDocument();
	} );
} );
