import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getJetpackSocialPostAlreadyShared } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'getJetpackSocialPostAlreadyShared', () => {
	beforeEach( () => {
		initEditor();
	} );

	afterEach( () => {
		resetEditor( {
			meta: {
				jetpack_social_post_already_shared: undefined,
			},
		} );
	} );

	it( 'returns the default value', () => {
		expect( getJetpackSocialPostAlreadyShared() ).toBe( false );
	} );

	it( 'returns value from post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_post_already_shared: true,
			},
		} );

		expect( getJetpackSocialPostAlreadyShared() ).toBe( true );

		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_post_already_shared: false,
			},
		} );

		expect( getJetpackSocialPostAlreadyShared() ).toBe( false );
	} );
} );
