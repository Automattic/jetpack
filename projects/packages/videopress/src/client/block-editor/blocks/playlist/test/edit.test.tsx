import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchVideoItem } from '../../../../lib/fetch-video-item';
import PlaylistEdit from '../edit';
import type { PlaylistAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

// What the mocked media library modal "selects" when the button is clicked.
let mockMediaSelection: unknown = [];

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
	MediaUpload: ( {
		onSelect,
		render: renderProp,
	}: {
		onSelect: ( selection: unknown ) => void;
		render: ( args: { open: () => void } ) => React.ReactNode;
	} ) => renderProp( { open: () => onSelect( mockMediaSelection ) } ),
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
	mockMediaSelection = [];
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

	it( 'shows an error when Add is pressed with an empty input', async () => {
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await userEvent.click( screen.getAllByRole( 'button', { name: 'Add' } )[ 0 ] );

		expect( screen.getAllByText( /No video found at that link/ ).length ).toBeGreaterThan( 0 );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'submits the URL with the Enter key', async () => {
		fetchVideoItemMock.mockResolvedValue( { title: 'Via Enter' } );
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await userEvent.type(
			screen.getAllByPlaceholderText( 'Paste a video URL' )[ 0 ],
			'abcDEF12{enter}'
		);

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcDEF12', title: 'Via Enter' } ],
			} )
		);
	} );

	it( 'shows the busy state and ignores re-submits while a video is being added', async () => {
		let resolveFetch: ( value: unknown ) => void = () => {};
		fetchVideoItemMock.mockReturnValue(
			new Promise( resolve => {
				resolveFetch = resolve;
			} )
		);
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await submitUrl( 'abcDEF12' );

		expect( screen.getAllByRole( 'button', { name: 'Adding…' } ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Reading metadata…' ).length ).toBeGreaterThan( 0 );

		// A second press while busy must not start another add.
		await userEvent.click( screen.getAllByRole( 'button', { name: 'Adding…' } )[ 0 ] );

		resolveFetch( { title: 'Once' } );
		await waitFor( () => expect( setAttributes ).toHaveBeenCalledTimes( 1 ) );
		expect( fetchVideoItemMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'adds media library selections, reading guid, title, poster and height', async () => {
		mockMediaSelection = [
			{
				videopress_guid: [ 'aaaaaaaa' ],
				title: 'From array',
				image: { src: 'https://example.com/image.jpg' },
				height: 240,
			},
			{
				videopress_guid: 'bbbbbbbb',
				thumb: { src: 'https://example.com/thumb.jpg' },
			},
			{ title: 'Not a VideoPress video' },
		];
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await userEvent.click( screen.getAllByRole( 'button', { name: 'Media Library' } )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [
				{
					guid: 'aaaaaaaa',
					title: 'From array',
					poster: 'https://example.com/image.jpg',
					height: 240,
				},
				{ guid: 'bbbbbbbb', poster: 'https://example.com/thumb.jpg' },
			],
		} );
	} );

	it( 'coerces numeric metadata the API returns as strings', async () => {
		fetchVideoItemMock.mockResolvedValue( {
			title: 'Low-res upload',
			duration: '724000',
			height: '240',
		} );
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await submitUrl( 'abcDEF12' );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcDEF12', title: 'Low-res upload', durationMs: 724000, height: 240 } ],
			} )
		);
	} );

	it( 'accepts a single media library selection object', async () => {
		mockMediaSelection = { videopress_guid: [ 'cccccccc' ], title: 'Single' };
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await userEvent.click( screen.getAllByRole( 'button', { name: 'Media Library' } )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ { guid: 'cccccccc', title: 'Single' } ],
		} );
	} );

	it( 'shows an error when no media library selection is a VideoPress video', async () => {
		mockMediaSelection = [ { title: 'Plain video' } ];
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );

		await userEvent.click( screen.getAllByRole( 'button', { name: 'Media Library' } )[ 0 ] );

		expect(
			screen.getAllByText( /None of the selected items are VideoPress videos/ ).length
		).toBeGreaterThan( 0 );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'changes the layout and playback options from the sidebar', async () => {
		const setAttributes = jest.fn();
		renderEdit( { videos: [ { guid: 'aaaaaaaa', title: 'First' } ] }, setAttributes );

		await userEvent.click( screen.getByRole( 'button', { name: 'Grid' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'grid' } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Strip' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'strip' } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Dark player surface' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { darkPlayer: true } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Autoplay next' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { autoplayNext: true } );
	} );

	it( 'changes the per-entry display options from the sidebar', async () => {
		const setAttributes = jest.fn();
		renderEdit( { videos: [ { guid: 'aaaaaaaa', title: 'First' } ] }, setAttributes );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Thumbnail' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showThumbnail: false } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Title' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showTitle: false } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Resolution' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showResolution: false } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Duration' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showDuration: false } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Position number' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showPositionNumber: true } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Total runtime in header' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showTotalRuntime: false } );
	} );

	it( 'reorders entries with drag and drop', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
			{ guid: 'cccccccc', title: 'Third' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		const list = screen.getByRole( 'list', { name: 'Playlist videos' } );
		const dataTransfer = { effectAllowed: '', dropEffect: '', setData: jest.fn() };
		const rows = () => within( list ).getAllByRole( 'listitem' );

		fireEvent.dragStart( rows()[ 0 ], { dataTransfer } );
		expect( rows()[ 0 ] ).toHaveClass( 'is-dragging' );

		fireEvent.dragOver( rows()[ 2 ], { dataTransfer } );
		expect( rows()[ 2 ] ).toHaveClass( 'is-drop-target' );

		// Leaving a row clears its drop indicator.
		fireEvent.dragLeave( rows()[ 2 ] );
		expect( rows()[ 2 ] ).not.toHaveClass( 'is-drop-target' );

		fireEvent.dragOver( rows()[ 2 ], { dataTransfer } );
		fireEvent.drop( rows()[ 2 ], { dataTransfer } );
		fireEvent.dragEnd( rows()[ 0 ], { dataTransfer } );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ videos[ 1 ], videos[ 2 ], videos[ 0 ] ],
		} );
		expect( rows()[ 0 ] ).not.toHaveClass( 'is-dragging' );
	} );

	it( 'narrows the sidebar rows while filtering and disables reordering', async () => {
		const videos = Array.from( { length: 9 }, ( _, i ) => ( {
			guid: `aaaaaaa${ i }`,
			title: `Video ${ i }`,
		} ) );
		renderEdit( { videos } );

		const list = screen.getByRole( 'list', { name: 'Playlist videos' } );
		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( 9 );

		await userEvent.type( screen.getByPlaceholderText( 'Filter 9 videos' ), 'Video 3' );

		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( 1 );
		expect( within( list ).getByText( 'Video 3' ) ).toBeInTheDocument();
		// Reorder handles disappear while the visible order is filtered.
		expect( within( list ).queryByRole( 'button', { name: /Reorder/ } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the preview on the same entry when one is moved from above it', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
			{ guid: 'cccccccc', title: 'Third' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		// Preview the second entry from the canvas list.
		await userEvent.click( screen.getByRole( 'button', { name: /Playing.*Second/ } ) );
		expect( screen.getByTitle( 'Second' ) ).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reorder “First”. Press up or down to move it.' } )
		);
		await userEvent.keyboard( '{ArrowDown}' );
		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ videos[ 1 ], videos[ 0 ], videos[ 2 ] ],
		} );
	} );

	it( 'keeps the preview on the same entry when one is moved from below it', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		// The default preview is the first entry; move the second above it.
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reorder “Second”. Press up or down to move it.' } )
		);
		await userEvent.keyboard( '{ArrowUp}' );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ videos[ 1 ], videos[ 0 ] ] } );
	} );

	it( 'keeps the preview on the same entry when one is removed above it', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
			{ guid: 'cccccccc', title: 'Third' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		await userEvent.click( screen.getByRole( 'button', { name: /Playing.*Second/ } ) );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Remove “First” from the playlist' } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ videos[ 1 ], videos[ 2 ] ] } );
	} );

	it( 'ignores out-of-range keyboard reorders', async () => {
		const videos = [
			{ guid: 'aaaaaaaa', title: 'First' },
			{ guid: 'bbbbbbbb', title: 'Second' },
		];
		const setAttributes = jest.fn();
		renderEdit( { videos }, setAttributes );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reorder “First”. Press up or down to move it.' } )
		);
		await userEvent.keyboard( '{ArrowUp}' );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );
