import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import LatestVideosPlaylistEdit from '../edit';
import type { LatestVideosPlaylistContext } from '../context';
import type { LatestVideosPlaylistAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

// What the block last handed its inner Video Playlist block.
let providedContext: LatestVideosPlaylistContext | undefined;
// Inner blocks options the block last rendered with.
let innerBlocksOptions: Record< string, unknown > | undefined;

// The publish-tracking hook has its own isolated test suite.
jest.mock( '../../playlist/use-publish-tracking', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	useInnerBlocksProps: ( props: Record< string, unknown >, options: Record< string, unknown > ) => {
		innerBlocksOptions = options;
		return { ...props, children: <div data-testid="inner-blocks" /> };
	},
	BlockContextProvider: ( {
		value,
		children,
	}: {
		value: Record< string, LatestVideosPlaylistContext >;
		children: React.ReactNode;
	} ) => {
		providedContext = value[ 'videopress/latestVideosPlaylist' ];
		return <>{ children }</>;
	},
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

const apiFetchMock = apiFetch as unknown as jest.Mock;

const DEFAULT_ATTRIBUTES: LatestVideosPlaylistAttributes = {
	count: 5,
	layout: 'side-rail',
	darkPlayer: false,
	showPlayer: true,
	entryClickAction: 'new-tab',
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
	providedContext = undefined;
	innerBlocksOptions = undefined;
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
	it( 'hands the newest videos and its options to a locked inner playlist block', async () => {
		renderEdit( { layout: 'grid' } );

		expect( screen.getByTestId( 'inner-blocks' ) ).toBeInTheDocument();
		expect( innerBlocksOptions ).toMatchObject( {
			template: [ [ 'videopress/playlist' ] ],
			templateLock: 'all',
			renderAppender: false,
		} );
		expect( providedContext ).toMatchObject( { status: 'loading', videos: [] } );

		await waitFor( () => expect( providedContext?.status ).toBe( 'ready' ) );
		expect( providedContext?.videos ).toEqual( [
			{ guid: 'aaaaaaaa', durationMs: 60000, height: 1080 },
			{ guid: 'bbbbbbbb', durationMs: 120000, height: 2160 },
		] );
		expect( providedContext?.attributes ).toMatchObject( { layout: 'grid', showTitle: true } );

		expect( requestQuery() ).toMatchObject( {
			per_page: '5',
			orderby: 'date',
			order: 'desc',
			videopress_has_guid: '1',
		} );
	} );

	it( 'offers no way to add videos by hand', async () => {
		renderEdit();
		await waitFor( () => expect( providedContext?.status ).toBe( 'ready' ) );

		expect( screen.queryByPlaceholderText( 'Paste a video URL' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Media Library' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Remove/ } ) ).not.toBeInTheDocument();
	} );

	it( 'stores the chosen number of videos and reloads them', async () => {
		const setAttributes = jest.fn();
		const { rerender } = renderEdit( {}, setAttributes );
		await waitFor( () => expect( providedContext?.status ).toBe( 'ready' ) );

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

	it( 'reports an unreadable library to the inner block', async () => {
		apiFetchMock.mockRejectedValue( new Error( 'offline' ) );
		renderEdit();

		await waitFor( () => expect( providedContext?.status ).toBe( 'error' ) );
	} );

	it( 'keeps the shared playback and display settings on this block', async () => {
		const setAttributes = jest.fn();
		renderEdit( {}, setAttributes );
		await waitFor( () => expect( providedContext?.status ).toBe( 'ready' ) );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Loop playlist' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { loopPlaylist: true } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Grid' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'grid' } );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Show player' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { showPlayer: false } );
	} );

	it( 'offers the click behavior with the player off and hands it to the canvas', async () => {
		const setAttributes = jest.fn();
		renderEdit( { showPlayer: false, entryClickAction: 'show-player' }, setAttributes );
		await waitFor( () => expect( providedContext?.status ).toBe( 'ready' ) );

		expect( providedContext?.attributes ).toMatchObject( {
			showPlayer: false,
			entryClickAction: 'show-player',
		} );
		expect( screen.getByRole( 'radio', { name: 'Show the player and play it' } ) ).toBeChecked();

		await userEvent.click(
			screen.getByRole( 'radio', { name: 'Open it on VideoPress in a new tab' } )
		);
		expect( setAttributes ).toHaveBeenCalledWith( { entryClickAction: 'new-tab' } );
	} );
} );
