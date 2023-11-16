import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getJetpackSocialOptions } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'getJetpackSocialOptions', () => {
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

	it( 'returns an empty object by default', () => {
		expect( getJetpackSocialOptions() ).toEqual( {} );
	} );

	it( 'returns the values from post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					some_option: 'some value',
				},
			},
		} );

		expect( getJetpackSocialOptions() ).toEqual( {
			some_option: 'some value',
		} );
	} );
} );
