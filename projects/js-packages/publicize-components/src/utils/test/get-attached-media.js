import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getAttachedMedia } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'getAttachedMedia', () => {
	beforeEach( () => {
		initEditor();
	} );

	afterEach( () => {
		resetEditor( {
			meta: {
				jetpack_social_options: undefined,
			},
		} );
	} );

	it( 'returns an empty array by default', () => {
		expect( getAttachedMedia() ).toEqual( [] );
	} );

	it( 'returns the values from post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					attached_media: [ { id: 1243 } ],
				},
			},
		} );

		expect( getAttachedMedia() ).toEqual( [ { id: 1243 } ] );

		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					attached_media: [],
				},
			},
		} );

		expect( getAttachedMedia() ).toEqual( [] );
	} );
} );
