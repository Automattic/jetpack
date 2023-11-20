import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { isPublicizeEnabled } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'isPublicizeEnabled', () => {
	beforeEach( () => {
		initEditor();
	} );

	afterEach( () => {
		resetEditor( {
			meta: {
				jetpack_publicize_feature_enabled: undefined,
			},
		} );
	} );

	it( 'returns the default value', () => {
		expect( isPublicizeEnabled() ).toBe( true );
	} );

	it( 'returns value from post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_publicize_feature_enabled: false,
			},
		} );

		expect( isPublicizeEnabled() ).toBe( false );

		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_publicize_feature_enabled: true,
			},
		} );

		expect( isPublicizeEnabled() ).toBe( true );
	} );
} );
