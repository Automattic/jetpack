import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchVideoItem } from '../../../../lib/fetch-video-item';
import PlaylistEdit from '../edit';
import type { PlaylistAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
	MediaUpload: ( {
		render: renderProp,
	}: {
		render: ( args: { open: () => void } ) => React.ReactNode;
	} ) => renderProp( { open: () => {} } ),
	MediaUploadCheck: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '../../../../lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn(),
} ) );

const fetchVideoItemMock = fetchVideoItem as unknown as jest.Mock;

const DEFAULT_ATTRIBUTES: PlaylistAttributes = {
	videos: [],
	layout: 'side-rail',
	darkPlayer: false,
	autoplayNext: false,
	showThumbnail: true,
	showTitle: true,
	showResolution: true,
	showDuration: true,
	showPositionNumber: false,
	showTotalRuntime: true,
};

/**
 * Render the edit component with merged attributes.
 *
 * @param overrides     - Attribute overrides.
 * @param setAttributes - setAttributes mock.
 */
function renderEdit(
	overrides: Partial< PlaylistAttributes > = {},
	setAttributes: jest.Mock = jest.fn()
) {
	const props = {
		attributes: { ...DEFAULT_ATTRIBUTES, ...overrides },
		setAttributes,
	} as unknown as BlockEditProps< PlaylistAttributes >;

	render( <PlaylistEdit { ...props } /> );
}

/**
 * Type into the URL field and press the Add button.
 *
 * @param value - Value to type.
 */
async function submitUrl( value: string ) {
	await userEvent.type( screen.getAllByPlaceholderText( 'Paste a video URL' )[ 0 ], value );
	await userEvent.click( screen.getAllByRole( 'button', { name: 'Add' } )[ 0 ] );
}

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'PlaylistEdit', () => {
	it( 'shows the build-a-playlist placeholder when the playlist is empty', () => {
		renderEdit();

		expect( screen.getByText( 'Build a video playlist' ) ).toBeInTheDocument();
		// One in the placeholder, one in the settings sidebar.
		expect( screen.getAllByRole( 'button', { name: 'Media Library' } ) ).toHaveLength( 2 );
		expect( screen.queryByTitle( 'Video Playlist player' ) ).not.toBeInTheDocument();
	} );

	it( 'adds a video by GUID with metadata read from the video data', async () => {
		fetchVideoItemMock.mockResolvedValue( {
			title: 'Kiln loading, start to finish',
			duration: 724000,
			height: 1080,
			poster: 'https://example.com/poster.jpg',
		} );
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await submitUrl( 'abcDEF12' );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [
					{
						guid: 'abcDEF12',
						title: 'Kiln loading, start to finish',
						durationMs: 724000,
						height: 1080,
						poster: 'https://example.com/poster.jpg',
					},
				],
			} )
		);
	} );

	it( 'accepts a VideoPress URL', async () => {
		fetchVideoItemMock.mockResolvedValue( { title: 'By URL' } );
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await submitUrl( 'https://videopress.com/v/abcDEF12' );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcDEF12', title: 'By URL' } ],
			} )
		);
		expect( fetchVideoItemMock ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: 'abcDEF12' } )
		);
	} );

	it( 'shows an error and adds nothing when the input is not a VideoPress link', async () => {
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await submitUrl( 'https://example.com/watch?v=nope' );

		expect( screen.getAllByText( /No video found at that link/ ).length ).toBeGreaterThan( 0 );
		expect( fetchVideoItemMock ).not.toHaveBeenCalled();
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'shows an error and adds nothing when the video data cannot be read', async () => {
		fetchVideoItemMock.mockRejectedValue( new Error( 'not found' ) );
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await submitUrl( 'abcDEF12' );

		await waitFor( () =>
			expect( screen.getAllByText( /No video found at that link/ ).length ).toBeGreaterThan( 0 )
		);
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'warns about duplicates and only adds after "Add anyway"', async () => {
		fetchVideoItemMock.mockResolvedValue( { title: 'Existing video' } );
		const existing = { guid: 'abcDEF12', title: 'Existing video' };
		const setAttributes = jest.fn();
		renderEdit( { videos: [ existing ] }, setAttributes );

		await submitUrl( 'abcDEF12' );

		expect(
			screen.getByText( '“Existing video” is already in this playlist' )
		).toBeInTheDocument();
		expect( setAttributes ).not.toHaveBeenCalled();

		await userEvent.click( screen.getByRole( 'button', { name: 'Add anyway' } ) );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ existing, { guid: 'abcDEF12', title: 'Existing video' } ],
			} )
		);
	} );

	it( 'dismisses the duplicate warning on Cancel', async () => {
		const setAttributes = jest.fn();
		renderEdit( { videos: [ { guid: 'abcDEF12', title: 'Existing' } ] }, setAttributes );

		await submitUrl( 'abcDEF12' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		// The a11y live region retains the announcement, so assert on the notice UI itself.
		expect( screen.queryByRole( 'button', { name: 'Add anyway' } ) ).not.toBeInTheDocument();
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'removes an entry', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Remove “First” from the playlist' } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ videos[ 1 ] ] } );
	} );

	it( 'reorders entries with the arrow keys on a drag handle', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		// Clicking the handle focuses it (it has no click action of its own).
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reorder “First”. Press up or down to move it.' } )
		);
		await userEvent.keyboard( '{ArrowDown}' );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ videos[ 1 ], videos[ 0 ] ] } );
	} );

	it( 'renders the canvas preview mirroring the playlist', () => {
		renderEdit( {
			videos: [
				{ guid: 'aaaaaaaa', title: 'First', durationMs: 60000, height: 1080 },
				{ guid: 'bbbbbbbb', title: 'Second', durationMs: 120000, height: 2160 },
			],
		} );

		expect( screen.getAllByText( '2 videos' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByTitle( 'First' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Up next' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'The canvas preview mirrors the sidebar order live — the block is not editable in place.'
			)
		).toBeInTheDocument();
	} );

	it( 'only offers the filter input on long playlists', () => {
		const shortList = Array.from( { length: 3 }, ( _, i ) => ( {
			guid: `aaaaaaa${ i }`,
			title: `Video ${ i }`,
		} ) );
		const { unmount } = render(
			<PlaylistEdit
				{ ...( {
					attributes: { ...DEFAULT_ATTRIBUTES, videos: shortList },
					setAttributes: jest.fn(),
				} as unknown as BlockEditProps< PlaylistAttributes > ) }
			/>
		);
		expect( screen.queryByPlaceholderText( 'Filter 3 videos' ) ).not.toBeInTheDocument();
		unmount();

		const longList = Array.from( { length: 9 }, ( _, i ) => ( {
			guid: `aaaaaaa${ i }`,
			title: `Video ${ i }`,
		} ) );
		renderEdit( { videos: longList } );
		expect( screen.getByPlaceholderText( 'Filter 9 videos' ) ).toBeInTheDocument();
	} );
} );
