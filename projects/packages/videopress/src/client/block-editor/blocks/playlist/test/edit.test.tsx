import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchVideoItem } from '../../../../lib/fetch-video-item';
import Edit from '../edit';
import type { PlaylistBlockAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

// What the mocked media modal "returns" when the library button is clicked.
let mockLibrarySelection: unknown = [];

jest.mock( '../../../../lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn( () => Promise.resolve( { title: 'Fetched title' } ) ),
} ) );

const mockFetchVideoItem = fetchVideoItem as jest.Mock;

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
	MediaUploadCheck: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
	MediaUpload: ( {
		onSelect,
		render: renderProp,
	}: {
		onSelect: ( selection: unknown ) => void;
		render: ( props: { open: () => void } ) => React.ReactNode;
	} ) => <>{ renderProp( { open: () => onSelect( mockLibrarySelection ) } ) }</>,
} ) );

/**
 * Render the Edit component with the given attributes.
 *
 * @param attributes - Partial block attributes.
 * @return The setAttributes mock.
 */
function renderEdit( attributes: Partial< PlaylistBlockAttributes > = {} ) {
	const setAttributes = jest.fn();
	// The component only consumes attributes/setAttributes; the remaining
	// BlockEditProps fields are editor-runtime plumbing it never touches.
	const props = {
		attributes: {
			videos: [],
			autoAdvance: true,
			loop: false,
			layout: 'rail',
			darkSurface: false,
			showThumbnail: true,
			showTitle: true,
			showResolution: true,
			showDuration: true,
			showPosition: false,
			showTotalRuntime: true,
			...attributes,
		},
		setAttributes,
	} as unknown as BlockEditProps< PlaylistBlockAttributes >;
	render( <Edit { ...props } /> );
	return { setAttributes };
}

/**
 * Scope queries to the settings sidebar.
 *
 * @return Queries bound to the InspectorControls container.
 */
function sidebar() {
	return within( screen.getByTestId( 'inspector-controls' ) );
}

describe( 'PlaylistBlockEdit', () => {
	it( 'shows the placeholder and adds a video by GUID with its fetched metadata', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		expect( screen.getByText( 'Build a video playlist' ) ).toBeInTheDocument();

		await user.type( sidebar().getByPlaceholderText( 'Paste a video URL' ), 'abcd1234' );
		await user.click( sidebar().getByText( 'Add' ) );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcd1234', title: 'Fetched title' } ],
			} )
		);
		expect( mockFetchVideoItem ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: 'abcd1234' } )
		);
	} );

	it( 'accepts a VideoPress URL and stores duration, resolution, and poster', async () => {
		const user = userEvent.setup();
		mockFetchVideoItem.mockResolvedValueOnce( {
			title: 'Kiln loading',
			duration: 724000,
			height: 1080,
			poster: 'https://videos.files.wordpress.com/efgh5678/poster.jpg',
		} );
		const { setAttributes } = renderEdit();

		await user.type(
			sidebar().getByPlaceholderText( 'Paste a video URL' ),
			'https://videopress.com/v/efgh5678'
		);
		await user.keyboard( '{Enter}' );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [
					{
						guid: 'efgh5678',
						title: 'Kiln loading',
						durationMs: 724000,
						height: 1080,
						poster: 'https://videos.files.wordpress.com/efgh5678/poster.jpg',
					},
				],
			} )
		);
	} );

	it( 'still adds the video when the metadata fetch fails', async () => {
		const user = userEvent.setup();
		mockFetchVideoItem.mockRejectedValueOnce( new Error( 'not reachable' ) );
		const { setAttributes } = renderEdit();

		await user.type( sidebar().getByPlaceholderText( 'Paste a video URL' ), 'abcd1234' );
		await user.click( sidebar().getByText( 'Add' ) );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'abcd1234' } ] } )
		);
	} );

	it( 'rejects unrecognized input with an error message', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		await user.type( sidebar().getByPlaceholderText( 'Paste a video URL' ), 'not a video' );
		await user.click( sidebar().getByText( 'Add' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		// The Notice also announces via an a11y live region, so match all.
		expect(
			screen.getAllByText( 'No video found at that link. Paste a VideoPress video URL or GUID.' )
				.length
		).toBeGreaterThan( 0 );
	} );

	it( 'warns about duplicates and only adds again on Add anyway', async () => {
		const user = userEvent.setup();
		// Stored title matches the fetch mock so the background refresh no-ops.
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234', title: 'Fetched title' } ],
		} );

		await user.type( sidebar().getByPlaceholderText( 'Paste a video URL' ), 'abcd1234' );
		await user.click( sidebar().getByText( 'Add' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect(
			screen.getAllByText( '“Fetched title” is already in this playlist' ).length
		).toBeGreaterThan( 0 );

		await user.click( sidebar().getByText( 'Add anyway' ) );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [
					{ guid: 'abcd1234', title: 'Fetched title' },
					{ guid: 'abcd1234', title: 'Fetched title' },
				],
			} )
		);
	} );

	it( 'dismisses the duplicate warning on Cancel', async () => {
		const user = userEvent.setup();
		// Stored title matches the fetch mock so the background refresh no-ops.
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234', title: 'Fetched title' } ],
		} );

		await user.type( sidebar().getByPlaceholderText( 'Paste a video URL' ), 'abcd1234' );
		await user.click( sidebar().getByText( 'Add' ) );
		await user.click( sidebar().getByText( 'Cancel' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( sidebar().queryByText( 'Add anyway' ) ).not.toBeInTheDocument();
	} );

	it( 'previews the first video and shows entry metadata', () => {
		renderEdit( {
			videos: [
				{ guid: 'abcd1234', title: 'First', durationMs: 724000, height: 1080 },
				{ guid: 'efgh5678' },
			],
		} );

		const preview = screen.getByTitle( 'VideoPress Playlist Player' );
		expect( preview ).toHaveAttribute(
			'src',
			expect.stringContaining( 'videopress.com/embed/abcd1234' )
		);

		// Titles list in both the canvas preview and the sidebar manage list.
		expect( screen.getAllByText( 'First' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'efgh5678' ) ).toHaveLength( 2 );
		// Sidebar meta line and canvas meta/badges show resolution and duration.
		expect( screen.getAllByText( '1080p · 12:04' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( '1080p' ).length ).toBeGreaterThan( 0 );
	} );

	it( 'refreshes stored metadata that differs from the video data', async () => {
		mockFetchVideoItem.mockResolvedValue( {
			title: 'Fetched title',
			duration: 400000,
			height: 720,
		} );
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234', title: 'Stale stored title' } ],
		} );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcd1234', title: 'Fetched title', durationMs: 400000, height: 720 } ],
			} )
		);
		mockFetchVideoItem.mockResolvedValue( { title: 'Fetched title' } );
	} );

	it( 'removes an item from the playlist', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ],
		} );

		await user.click( screen.getAllByLabelText( 'Remove from playlist' )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'efgh5678' } ] } );
	} );

	it( 'reorders videos with drag and drop', () => {
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' }, { guid: 'ijkl9012' } ],
		} );

		const items = sidebar().getAllByRole( 'option' );

		fireEvent.dragStart( items[ 0 ] );
		fireEvent.dragOver( items[ 2 ] );
		fireEvent.drop( items[ 2 ] );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ { guid: 'efgh5678' }, { guid: 'ijkl9012' }, { guid: 'abcd1234' } ],
		} );
	} );

	it( 'reorders videos with the keyboard', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ],
		} );

		// Focus the first playlist option, then move it down with the arrow key.
		await user.click( sidebar().getAllByRole( 'option' )[ 0 ] );
		await user.keyboard( '{ArrowDown}' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ { guid: 'efgh5678' }, { guid: 'abcd1234' } ],
		} );
	} );

	it( 'does not reorder from the edges or while filtering', async () => {
		const user = userEvent.setup();
		// Titles match the fetch mock so the background refresh no-ops.
		const videos = Array.from( { length: 9 }, ( _, i ) => ( {
			guid: `guid000${ i }`,
			title: 'Fetched title',
		} ) );
		const { setAttributes } = renderEdit( { videos } );

		// ArrowUp on the first item is a no-op.
		await user.click( sidebar().getAllByRole( 'option' )[ 0 ] );
		await user.keyboard( '{ArrowUp}' );
		expect( setAttributes ).not.toHaveBeenCalled();

		// While filtering (the haystack includes the GUID), items are not
		// draggable and arrows do nothing.
		await user.type( sidebar().getByPlaceholderText( 'Filter 9 videos' ), 'guid0003' );
		const filtered = sidebar().getAllByRole( 'option' );
		expect( filtered ).toHaveLength( 1 );
		expect( filtered[ 0 ] ).toHaveAttribute( 'draggable', 'false' );
		await user.click( filtered[ 0 ] );
		await user.keyboard( '{ArrowDown}' );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'clears the drop target when the drag leaves an item', () => {
		renderEdit( { videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ] } );

		const items = sidebar().getAllByRole( 'option' );

		fireEvent.dragStart( items[ 0 ] );
		fireEvent.dragOver( items[ 1 ] );
		expect( items[ 1 ] ).toHaveClass( 'is-drop-target' );

		fireEvent.dragLeave( items[ 1 ] );
		expect( items[ 1 ] ).not.toHaveClass( 'is-drop-target' );

		// Dropping on the dragged item itself is a no-op reorder.
		fireEvent.drop( items[ 0 ] );
		expect( items[ 0 ] ).not.toHaveClass( 'is-dragging' );
	} );

	it( 'shows the skeleton row while metadata is being read', async () => {
		const user = userEvent.setup();
		let resolveFetch: ( value: unknown ) => void;
		mockFetchVideoItem.mockImplementationOnce(
			() =>
				new Promise( resolve => {
					resolveFetch = resolve;
				} )
		);
		renderEdit();

		await user.type( sidebar().getByPlaceholderText( 'Paste a video URL' ), 'abcd1234' );
		await user.click( sidebar().getByText( 'Add' ) );

		expect( sidebar().getByText( 'Reading metadata…' ) ).toBeInTheDocument();

		resolveFetch( { title: 'Fetched title' } );
		await waitFor( () =>
			expect( sidebar().queryByText( 'Reading metadata…' ) ).not.toBeInTheDocument()
		);
	} );

	it( 'marks the hovered item as the drop target while dragging', () => {
		renderEdit( { videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ] } );

		const items = sidebar().getAllByRole( 'option' );

		fireEvent.dragStart( items[ 0 ] );
		fireEvent.dragOver( items[ 1 ] );

		expect( items[ 0 ] ).toHaveClass( 'is-dragging' );
		expect( items[ 1 ] ).toHaveClass( 'is-drop-target' );

		fireEvent.dragEnd( items[ 0 ] );

		expect( items[ 0 ] ).not.toHaveClass( 'is-dragging' );
		expect( items[ 1 ] ).not.toHaveClass( 'is-drop-target' );
	} );

	it( 'filters long playlists without losing original positions', async () => {
		const user = userEvent.setup();
		const videos = Array.from( { length: 9 }, ( _, i ) => ( {
			guid: `guid000${ i }`,
			title: i === 8 ? 'Needle' : `Video ${ i }`,
		} ) );
		const { setAttributes } = renderEdit( { videos } );

		await user.type( sidebar().getByPlaceholderText( 'Filter 9 videos' ), 'Needle' );

		const items = sidebar().getAllByRole( 'option' );
		expect( items ).toHaveLength( 1 );
		// Removing the filtered item removes the right entry.
		await user.click( within( items[ 0 ] ).getByLabelText( 'Remove from playlist' ) );
		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: videos.slice( 0, 8 ),
		} );
	} );

	it( 'switches the preview when selecting another item', async () => {
		const user = userEvent.setup();
		renderEdit( { videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ] } );

		await user.click( screen.getByLabelText( 'Preview video 2' ) );

		expect( screen.getByTitle( 'VideoPress Playlist Player' ) ).toHaveAttribute(
			'src',
			expect.stringContaining( 'videopress.com/embed/efgh5678' )
		);
	} );

	it( 'adds VideoPress videos selected from the media library', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		mockLibrarySelection = [
			{
				videopress_guid: [ 'efgh5678' ],
				title: 'Library video',
				image: { src: 'https://example.test/thumb.jpg' },
			},
			{ videopress_guid: 'ijkl9012', title: '' },
			{ title: 'Not a VideoPress video' },
		];

		await user.click( sidebar().getByText( 'Media Library' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [
				{ guid: 'abcd1234' },
				{ guid: 'efgh5678', title: 'Library video', poster: 'https://example.test/thumb.jpg' },
				{ guid: 'ijkl9012' },
			],
		} );
	} );

	it( 'shows an error when no library selection is a VideoPress video', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		mockLibrarySelection = [ { title: 'Plain video attachment' } ];

		await user.click( sidebar().getByText( 'Media Library' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		// The Notice also announces via an a11y live region, so match all.
		expect(
			screen.getAllByText(
				'None of the selected items are VideoPress videos. Choose videos hosted on VideoPress.'
			).length
		).toBeGreaterThan( 0 );
	} );

	it( 'keeps all management controls in the settings sidebar; the canvas is preview-only', () => {
		renderEdit( { videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ] } );

		// Add, drag-to-sort, and delete all live in the sidebar.
		expect( sidebar().getByPlaceholderText( 'Paste a video URL' ) ).toBeInTheDocument();
		expect( sidebar().getByText( 'Add' ) ).toBeInTheDocument();
		expect( sidebar().getByText( 'Media Library' ) ).toBeInTheDocument();
		expect( sidebar().getAllByLabelText( 'Remove from playlist' ) ).toHaveLength( 2 );
		for ( const item of sidebar().getAllByRole( 'option' ) ) {
			expect( item ).toHaveAttribute( 'draggable', 'true' );
		}

		// The canvas only previews: item selection, no management controls.
		expect( screen.getAllByLabelText( 'Remove from playlist' ) ).toHaveLength( 2 );
		expect( screen.getByLabelText( 'Preview video 2' ) ).toBeInTheDocument();
	} );

	it( 'offers URL input and Media Library in the empty-state placeholder', () => {
		renderEdit();

		expect( screen.getByText( 'Build a video playlist' ) ).toBeInTheDocument();

		// Both the placeholder and the sidebar offer the add controls.
		expect( screen.getAllByPlaceholderText( 'Paste a video URL' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'Media Library' ) ).toHaveLength( 2 );
	} );

	it( 'switches layout from the layout picker', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		await user.click( sidebar().getByText( 'Grid' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'grid' } );

		await user.click( sidebar().getByText( 'Strip' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'strip' } );
	} );

	it( 'toggles playback and display settings', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		await user.click( sidebar().getByLabelText( 'Autoplay next' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { autoAdvance: false } );

		await user.click( sidebar().getByLabelText( 'Loop playlist' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { loop: true } );

		await user.click( sidebar().getByLabelText( 'Dark player surface' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { darkSurface: true } );

		await user.click( sidebar().getByLabelText( 'Thumbnail' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showThumbnail: false } );

		await user.click( sidebar().getByLabelText( 'Position number' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showPosition: true } );

		await user.click( sidebar().getByLabelText( 'Total runtime in header' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showTotalRuntime: false } );
	} );

	it( 'reflects layout and display attributes on the block wrapper', () => {
		renderEdit( {
			videos: [ { guid: 'abcd1234' } ],
			layout: 'grid',
			darkSurface: true,
			showThumbnail: false,
			showPosition: true,
		} );

		const preview = screen.getByTitle( 'VideoPress Playlist Player' );
		// The wrapper is a plain div carrying only CSS classes, so there is no
		// accessible query for it; walk up from the player instead.
		// eslint-disable-next-line testing-library/no-node-access
		const wrapper = preview.closest( '.videopress-playlist--grid' );
		expect( wrapper ).not.toBeNull();
		expect( wrapper ).toHaveClass( 'is-dark' );
		expect( wrapper ).toHaveClass( 'hide-thumbnails' );
		expect( wrapper ).toHaveClass( 'show-position' );
	} );
} );
