import { makeLibraryItem as item } from '../../../test-utils/library-item';
import { buildLibraryFields } from '../fields';
import type { LibraryItem } from '../../../types/library';
import type { Playlist } from '../../../types/playlist';

type InitialState = { features?: { studio?: boolean } };

const setStudioEnabled = ( studio: boolean ) => {
	(
		window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState }
	 ).JPVIDEOPRESS_INITIAL_STATE = { features: { studio } };
};

const clearInitialState = () => {
	delete ( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState } )
		.JPVIDEOPRESS_INITIAL_STATE;
};

const makePlaylist = ( overrides: Partial< Playlist > = {} ): Playlist => ( {
	id: 1,
	name: 'My playlist',
	description: '',
	count: 0,
	artworkId: null,
	type: 'collection',
	order: [],
	...overrides,
} );

// The exact field list the library shipped before the factory refactor.
// Flag-off output must keep matching it.
const PRE_REFACTOR_FIELD_IDS = [
	'thumbnail',
	'title',
	'filename',
	'type',
	'uploadDate',
	'duration',
	'privacy',
	'fileSize',
];

describe( 'buildLibraryFields — Studio flag off', () => {
	afterEach( clearInitialState );

	it( 'returns exactly the pre-refactor field list', () => {
		expect( buildLibraryFields().map( field => field.id ) ).toEqual( PRE_REFACTOR_FIELD_IDS );
	} );

	it( 'ignores supplied playlists entirely (no playlists field, identical output)', () => {
		const withPlaylists = buildLibraryFields( {
			playlists: [ makePlaylist( { id: 7, name: 'Tutorials' } ) ],
		} );

		expect( withPlaylists.map( field => field.id ) ).toEqual( PRE_REFACTOR_FIELD_IDS );
		// Same field objects as the argument-less call — the playlists param
		// must not alter anything when the flag is off.
		expect( withPlaylists ).toEqual( buildLibraryFields() );
	} );

	it( 'is off by default when the initial-state global is absent', () => {
		clearInitialState();
		expect( buildLibraryFields().find( field => field.id === 'playlists' ) ).toBeUndefined();
	} );
} );

describe( 'buildLibraryFields — Studio flag on', () => {
	beforeEach( () => setStudioEnabled( true ) );
	afterEach( clearInitialState );

	const playlists = [
		makePlaylist( { id: 7, name: 'Tutorials' } ),
		makePlaylist( { id: 9, name: 'Launches' } ),
	];

	it( 'appends a playlists field after the base fields', () => {
		expect( buildLibraryFields( { playlists } ).map( field => field.id ) ).toEqual( [
			...PRE_REFACTOR_FIELD_IDS,
			'playlists',
		] );
	} );

	it( 'builds filter elements from the playlists and only offers the `is` operator', () => {
		const field = buildLibraryFields( { playlists } ).find( f => f.id === 'playlists' );

		expect( field?.filterBy ).toEqual( { operators: [ 'is' ] } );
		expect( field?.elements ).toEqual( [
			{ value: 7, label: 'Tutorials' },
			{ value: 9, label: 'Launches' },
		] );
		expect( field?.enableSorting ).toBe( false );
	} );

	it( 'renders the item playlist names, dropping ids the fetch does not know', () => {
		const field = buildLibraryFields( { playlists } ).find( f => f.id === 'playlists' );
		const renderCell = field?.render as ( args: { item: LibraryItem } ) => React.ReactNode;

		expect( renderCell( { item: item( { playlistIds: [ 9, 7, 123 ] } ) } ) ).toBe(
			'Launches, Tutorials'
		);
		expect( renderCell( { item: item( { playlistIds: [] } ) } ) ).toBe( '' );
	} );

	it( 'exposes the raw term ids as the field value', () => {
		const field = buildLibraryFields( { playlists } ).find( f => f.id === 'playlists' );
		expect( field?.getValue?.( { item: item( { playlistIds: [ 7 ] } ) } ) ).toEqual( [ 7 ] );
	} );
} );
