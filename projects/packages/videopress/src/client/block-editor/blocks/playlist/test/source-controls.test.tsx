import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaylistSourcePanel, SourcedPlaylistEdit } from '../source-controls';
import type { PlaylistAttributes } from '../types';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

// The display settings have their own tests with the playlist edit component.
jest.mock( '../inspector-controls', () => ( {
	PlaylistSettingsPanels: () => <div data-testid="settings-panels" />,
	PlaylistStylesControls: () => <div data-testid="styles-controls" />,
} ) );

// The preview and the live metadata have their own tests; here, only which videos reach them.
const mockUseLiveMetadata = jest.fn< { liveMetadata: object }, [ unknown ] >( () => ( {
	liveMetadata: {},
} ) );
jest.mock( '../use-live-metadata', () => ( {
	__esModule: true,
	default: ( videos: Array< { guid: string } > ) => mockUseLiveMetadata( videos ),
} ) );
jest.mock( '../preview', () => ( {
	__esModule: true,
	default: ( { videos }: { videos: Array< { guid: string } > } ) => (
		<ol data-testid="playlist-preview">
			{ videos.map( video => (
				<li key={ video.guid }>{ video.guid }</li>
			) ) }
		</ol>
	),
} ) );

/**
 * Attributes of a playlist block, with overrides.
 *
 * @param overrides - Attribute overrides.
 * @return Attributes.
 */
function attributes( overrides: Partial< PlaylistAttributes > = {} ) {
	return { videos: [], showPlaylistTitle: true, ...overrides } as PlaylistAttributes;
}

afterEach( () => {
	delete window.videopressChannelEditor;
} );

describe( 'PlaylistSourcePanel', () => {
	it( 'defaults to the block’s own videos and switches the source', async () => {
		const setAttributes = jest.fn();
		render( <PlaylistSourcePanel attributes={ attributes() } setAttributes={ setAttributes } /> );

		// Collapsed until the block shows another playlist.
		expect( screen.queryByRole( 'combobox', { name: 'Videos' } ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Source' } ) );
		const select = screen.getByRole( 'combobox', { name: 'Videos' } );
		expect( select ).toHaveValue( 'own' );
		expect( screen.queryByRole( 'textbox', { name: 'Playlist ID' } ) ).not.toBeInTheDocument();

		await userEvent.selectOptions( select, 'index' );
		expect( setAttributes ).toHaveBeenCalledWith( { source: 'index' } );
	} );

	it( 'picks the playlist to show for the index source', async () => {
		window.videopressChannelEditor = { playlists: [ { key: 'mc', title: 'Molten Core' } ] };
		const setAttributes = jest.fn();
		render(
			<PlaylistSourcePanel
				attributes={ attributes( { source: 'index' } ) }
				setAttributes={ setAttributes }
			/>
		);

		await userEvent.selectOptions( screen.getByRole( 'combobox', { name: 'Playlist' } ), 'mc' );
		expect( setAttributes ).toHaveBeenCalledWith( { sourcePlaylistId: 'mc' } );
	} );
} );

describe( 'SourcedPlaylistEdit', () => {
	const playlists = [
		{
			key: 'road',
			title: 'The road to 60',
			videos: [ { guid: 'ghiJKL34', durationMs: 1000, height: 1080 } ],
		},
		{
			key: 'mc',
			title: 'Molten Core progression',
			videos: [ { guid: 'abcDEF12' }, { guid: 'ghiJKL34' } ],
		},
		{ key: 'new', title: 'Coming soon', videos: [] },
	];

	/**
	 * Render the canvas of an `index` playlist block.
	 *
	 * @param sourcePlaylistId - Picked playlist key.
	 */
	function renderSourced( sourcePlaylistId?: string ) {
		render(
			<SourcedPlaylistEdit
				attributes={ attributes( { source: 'index', sourcePlaylistId, layout: 'grid' } ) }
				setAttributes={ jest.fn() }
			/>
		);
	}

	/**
	 * GUIDs the preview lists.
	 *
	 * @return GUIDs.
	 */
	function previewGuids() {
		return within( screen.getByTestId( 'playlist-preview' ) )
			.getAllByRole( 'listitem' )
			.map( item => item.textContent );
	}

	it( 'previews the picked playlist with the block’s display settings', () => {
		window.videopressChannelEditor = { playlists };
		renderSourced( 'mc' );

		expect( previewGuids() ).toEqual( [ 'abcDEF12', 'ghiJKL34' ] );
		expect( mockUseLiveMetadata ).toHaveBeenLastCalledWith( playlists[ 1 ].videos );
		expect( screen.getByRole( 'figure' ) ).toHaveClass( 'videopress-playlist', 'is-layout-grid' );
		expect( screen.getByTestId( 'settings-panels' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'styles-controls' ) ).toBeInTheDocument();
	} );

	it( 'keeps a placeholder for the playlist being viewed, only known on the site', () => {
		window.videopressChannelEditor = { playlists };
		render(
			<SourcedPlaylistEdit
				attributes={ attributes( { source: 'queried' } ) }
				setAttributes={ jest.fn() }
			/>
		);

		expect( screen.queryByTestId( 'playlist-preview' ) ).not.toBeInTheDocument();
		expect(
			screen.getAllByText( 'On a channel playlist or video page, shows the playlist being viewed.' )
				.length
		).toBeGreaterThan( 0 );
	} );

	it( 'previews the most recently updated playlist when none is picked', () => {
		window.videopressChannelEditor = { playlists };
		renderSourced();

		expect( previewGuids() ).toEqual( [ 'ghiJKL34' ] );
	} );

	it.each( [
		[ 'a playlist without videos', { playlists }, 'new', 'This playlist has no videos yet.' ],
		[
			'a playlist that is no longer published',
			{ playlists },
			'gone',
			'This playlist is no longer published. Pick another one in the block settings.',
		],
		[
			'a site without playlists',
			{ playlists: [] },
			'',
			'No playlists yet. Publish a Video Playlist block with a title and it will show up here.',
		],
		[
			'an editor without the playlist list',
			undefined,
			'mc',
			'Shows a playlist published on this site.',
		],
	] )( 'shows a placeholder for %s', ( _case, data, key, instructions ) => {
		window.videopressChannelEditor = data;
		renderSourced( key );

		expect( screen.queryByTestId( 'playlist-preview' ) ).not.toBeInTheDocument();
		expect( screen.getAllByText( instructions ).length ).toBeGreaterThan( 0 );
		expect( screen.getByTestId( 'settings-panels' ) ).toBeInTheDocument();
	} );
} );
