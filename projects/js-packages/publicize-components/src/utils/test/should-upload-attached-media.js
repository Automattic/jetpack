import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { shouldUploadAttachedMedia } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'shouldUploadAttachedMedia', () => {
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

	it( 'returns the default value', () => {
		expect( shouldUploadAttachedMedia() ).toBe( false );
	} );

	it( 'returns the values from post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					should_upload_attached_media: true,
				},
			},
		} );

		expect( shouldUploadAttachedMedia() ).toBe( true );

		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					should_upload_attached_media: false,
				},
			},
		} );

		expect( shouldUploadAttachedMedia() ).toBe( false );
	} );
} );
