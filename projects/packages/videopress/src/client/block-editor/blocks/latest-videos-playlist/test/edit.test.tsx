import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import LatestVideosPlaylistEdit from '../edit';
import type { LatestVideosPlaylistAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

// The publish-tracking hook has its own isolated test suite.
jest.mock( '../../playlist/use-publish-tracking', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
	useSettings: ( ...paths: string[] ) => paths.map( () => undefined ),
	__experimentalFontFamilyControl: () => null,
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Titles are live data resolved per GUID, like the Video Playlist block.
jest.mock( '../../../../lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn( ( { guid }: { guid: string } ) =>
		Promise.resolve( { title: `Title of ${ guid }` } )
	),
} ) );

jest.mock( '../../../../lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn( () => Promise.resolve( { token: null } ) ),
} ) );

const apiFetchMock = apiFetch as unknown as jest.Mock;

const DEFAULT_ATTRIBUTES: LatestVideosPlaylistAttributes = {
	count: 5,
	layout: 'side-rail',
	darkPlayer: false,
	autoplayNext: false,
	muteByDefault: false,
	loopPlaylist: false,
	showThumbnail: true,
	showTitle: true,
	showResolution: true,
	showDuration: true,
	showPositionNumber: false,
	showTotalRuntime: true,
	entryTitleFontFamily: '',
};

/**
 * Render the edit component with merged attributes.
 *
 * @param overrides     - Attribute overrides.
 * @param setAttributes - setAttributes mock.
 * @return The render result.
 */
function renderEdit(
	overrides: Partial< LatestVideosPlaylistAttributes > = {},
	setAttributes: jest.Mock = jest.fn()
) {
	const props = {
		attributes: { ...DEFAULT_ATTRIBUTES, ...overrides },
		setAttributes,
		clientId: 'latest-videos-client-1',
	} as unknown as BlockEditProps< LatestVideosPlaylistAttributes >;

	return render( <LatestVideosPlaylistEdit { ...props } /> );
}

/**
 * Decode the query string of the path apiFetch was called with.
 *
 * @param call - Index of the apiFetch call.
 * @return Query parameters.
 */
function requestQuery( call = 0 ): Record< string, string > {
	const { path } = apiFetchMock.mock.calls[ call ][ 0 ];
	return Object.fromEntries( new URLSearchParams( path.split( '?' )[ 1 ] ) );
}

beforeEach( () => {
	jest.clearAllMocks();
	apiFetchMock.mockResolvedValue( [
		{
			id: 3,
			jetpack_videopress_guid: 'aaaaaaaa',
			media_details: { height: 1080, videopress: { duration: 60000 } },
		},
		{
			id: 2,
			jetpack_videopress_guid: 'bbbbbbbb',
			media_details: { height: 2160, videopress: { duration: 120000 } },
		},
	] );
} );

describe( 'LatestVideosPlaylistEdit', () => {
	it( 'previews the newest videos from the library', async () => {
		renderEdit();

		expect( screen.getByText( 'Loading your latest videos…' ) ).toBeInTheDocument();

		await expect( screen.findByTitle( 'Title of aaaaaaaa' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( '2 videos' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Title of bbbbbbbb' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Up next' ) ).toBeInTheDocument();

		expect( requestQuery() ).toMatchObject( {
			per_page: '5',
			orderby: 'date',
			order: 'desc',
			videopress_has_guid: '1',
		} );
	} );

	it( 'offers no way to add videos by hand', async () => {
		renderEdit();
		await expect( screen.findByTitle( 'Title of aaaaaaaa' ) ).resolves.toBeInTheDocument();

		expect( screen.queryByPlaceholderText( 'Paste a video URL' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Media Library' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Remove/ } ) ).not.toBeInTheDocument();
	} );

	it( 'stores the chosen number of videos and reloads the preview', async () => {
		const setAttributes = jest.fn();
		const { rerender } = renderEdit( {}, setAttributes );
		await expect( screen.findByTitle( 'Title of aaaaaaaa' ) ).resolves.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot drive range inputs.
		fireEvent.change( screen.getByRole( 'slider', { name: 'Number of videos' } ), {
			target: { value: '8' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( { count: 8 } );

		rerender(
			<LatestVideosPlaylistEdit
				{ ...( {
					attributes: { ...DEFAULT_ATTRIBUTES, count: 8 },
					setAttributes,
					clientId: 'latest-videos-client-1',
				} as unknown as BlockEditProps< LatestVideosPlaylistAttributes > ) }
			/>
		);

		await waitFor( () => expect( apiFetchMock ).toHaveBeenCalledTimes( 2 ) );
		expect( requestQuery( 1 ).per_page ).toBe( '8' );
	} );

	it( 'explains an empty library', async () => {
		apiFetchMock.mockResolvedValue( [] );
		renderEdit();

		await expect( screen.findByText( 'No VideoPress videos yet' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Up next' ) ).not.toBeInTheDocument();
	} );

	it( 'reports when the library cannot be read', async () => {
		apiFetchMock.mockRejectedValue( new Error( 'offline' ) );
		renderEdit();

		await expect(
			screen.findByText( 'Your latest videos could not be loaded' )
		).resolves.toBeInTheDocument();
	} );

	it( 'keeps the shared playback and display settings', async () => {
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );
		await expect( screen.findByTitle( 'Title of aaaaaaaa' ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Loop playlist' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { loopPlaylist: true } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Grid' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'grid' } );
	} );
} );
