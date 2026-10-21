import { renderHook } from '@testing-library/react';
import usePlaylistId, { generatePlaylistId } from '../use-playlist-id';

// Block-editor state driving the hook: playlist block client ids and their attributes.
let mockPlaylistBlocks: Record< string, { playlistId?: string } > = {};

jest.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( {
			getBlocksByName: () => Object.keys( mockPlaylistBlocks ),
			getBlockAttributes: ( clientId: string ) => mockPlaylistBlocks[ clientId ] ?? null,
		} ) ),
} ) );

beforeEach( () => {
	mockPlaylistBlocks = {};
} );

describe( 'generatePlaylistId', () => {
	it( 'returns distinct non-empty keys', () => {
		const first = generatePlaylistId();
		const second = generatePlaylistId();

		expect( first ).not.toBe( '' );
		expect( first ).not.toBe( second );
	} );
} );

describe( 'usePlaylistId', () => {
	it( 'assigns an id to a block without one', () => {
		const setAttributes = jest.fn();

		renderHook( () => usePlaylistId( { clientId: 'a', playlistId: '', setAttributes } ) );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes.mock.calls[ 0 ][ 0 ].playlistId ).not.toBe( '' );
	} );

	it( 'keeps the id of the block that owns it', () => {
		mockPlaylistBlocks = { a: { playlistId: 'key-1' } };
		const setAttributes = jest.fn();

		renderHook( () => usePlaylistId( { clientId: 'a', playlistId: 'key-1', setAttributes } ) );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'replaces an id another block already carries', () => {
		mockPlaylistBlocks = { a: { playlistId: 'key-1' }, b: { playlistId: 'key-1' } };
		const setAttributes = jest.fn();

		renderHook( () => usePlaylistId( { clientId: 'b', playlistId: 'key-1', setAttributes } ) );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes.mock.calls[ 0 ][ 0 ].playlistId ).not.toBe( 'key-1' );
	} );
} );
