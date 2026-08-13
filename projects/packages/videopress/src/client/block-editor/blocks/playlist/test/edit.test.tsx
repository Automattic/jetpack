import { render, screen, waitFor } from '@testing-library/react';
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
	InspectorControls: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
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
		attributes: { videos: [], autoAdvance: true, loop: false, ...attributes },
		setAttributes,
	} as unknown as BlockEditProps< PlaylistBlockAttributes >;
	render( <Edit { ...props } /> );
	return { setAttributes };
}

describe( 'PlaylistBlockEdit', () => {
	it( 'shows the placeholder and adds a video by GUID with its fetched title', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		expect( screen.getByText( 'VideoPress Playlist' ) ).toBeInTheDocument();

		await user.type( screen.getByPlaceholderText( 'VideoPress GUID or URL' ), 'abcd1234' );
		await user.click( screen.getByText( 'Add to playlist' ) );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcd1234', title: 'Fetched title' } ],
			} )
		);
		expect( mockFetchVideoItem ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: 'abcd1234' } )
		);
	} );

	it( 'accepts a VideoPress URL and pulls the title from the video data', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		await user.type(
			screen.getByPlaceholderText( 'VideoPress GUID or URL' ),
			'https://videopress.com/v/efgh5678'
		);
		await user.keyboard( '{Enter}' );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'efgh5678', title: 'Fetched title' } ],
			} )
		);
	} );

	it( 'still adds the video when the title fetch fails', async () => {
		const user = userEvent.setup();
		mockFetchVideoItem.mockRejectedValueOnce( new Error( 'not reachable' ) );
		const { setAttributes } = renderEdit();

		await user.type( screen.getByPlaceholderText( 'VideoPress GUID or URL' ), 'abcd1234' );
		await user.click( screen.getByText( 'Add to playlist' ) );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'abcd1234' } ] } )
		);
	} );

	it( 'rejects unrecognized input with an error message', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		await user.type( screen.getByPlaceholderText( 'VideoPress GUID or URL' ), 'not a video' );
		await user.click( screen.getByText( 'Add to playlist' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		// The Notice also announces via an a11y live region, so match all.
		expect(
			screen.getAllByText( 'Enter a VideoPress GUID or a VideoPress video URL.' ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'previews the first video and lists every item', () => {
		renderEdit( {
			videos: [ { guid: 'abcd1234', title: 'First' }, { guid: 'efgh5678' } ],
		} );

		const preview = screen.getByTitle( 'VideoPress Playlist Player' );
		expect( preview ).toHaveAttribute(
			'src',
			expect.stringContaining( 'videopress.com/embed/abcd1234' )
		);

		expect( screen.getByText( 'First' ) ).toBeInTheDocument();
		expect( screen.getByText( 'efgh5678' ) ).toBeInTheDocument();
	} );

	it( 'shows item titles as plain text, with only the add-video field editable', () => {
		renderEdit( { videos: [ { guid: 'abcd1234', title: 'First' } ] } );

		expect( screen.getByText( 'First' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'textbox' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
			'placeholder',
			'VideoPress GUID or URL'
		);
	} );

	it( 'pulls missing titles from the video data', async () => {
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcd1234', title: 'Fetched title' } ],
			} )
		);
	} );

	it( 'replaces stored titles that differ from the video data', async () => {
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234', title: 'Stale stored title' } ],
		} );

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith( {
				videos: [ { guid: 'abcd1234', title: 'Fetched title' } ],
			} )
		);
	} );

	it( 'removes an item from the playlist', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ],
		} );

		await user.click( screen.getAllByLabelText( 'Remove from playlist' )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'efgh5678' } ] } );
	} );

	it( 'moves an item down and disables the impossible directions', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ],
		} );

		expect( screen.getAllByLabelText( 'Move up' )[ 0 ] ).toBeDisabled();
		expect( screen.getAllByLabelText( 'Move down' )[ 1 ] ).toBeDisabled();

		await user.click( screen.getAllByLabelText( 'Move down' )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ { guid: 'efgh5678' }, { guid: 'abcd1234' } ],
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
			{ videopress_guid: [ 'efgh5678' ], title: 'Library video' },
			{ videopress_guid: 'ijkl9012', title: '' },
			{ title: 'Not a VideoPress video' },
		];

		await user.click( screen.getByText( 'Choose from library' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [
				{ guid: 'abcd1234' },
				{ guid: 'efgh5678', title: 'Library video' },
				{ guid: 'ijkl9012' },
			],
		} );
	} );

	it( 'shows an error when no library selection is a VideoPress video', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		mockLibrarySelection = [ { title: 'Plain video attachment' } ];

		await user.click( screen.getByText( 'Choose from library' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		// The Notice also announces via an a11y live region, so match all.
		expect(
			screen.getAllByText(
				'None of the selected items are VideoPress videos. Choose videos hosted on VideoPress.'
			).length
		).toBeGreaterThan( 0 );
	} );

	it( 'toggles the auto-advance and loop settings', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		await user.click( screen.getByLabelText( 'Autoplay next video' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { autoAdvance: false } );

		await user.click( screen.getByLabelText( 'Loop playlist' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { loop: true } );
	} );
} );
