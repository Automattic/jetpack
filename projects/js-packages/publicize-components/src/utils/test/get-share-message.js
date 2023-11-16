import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getShareMessageMaxLength } from '..';
import { getShareMessage } from '../get-share-message';
import { initEditor, resetEditor } from '../test-utils';

describe( 'getShareMessage', () => {
	beforeEach( () => {
		initEditor();
	} );

	afterEach( () => {
		resetEditor( {
			meta: {
				jetpack_publicize_message: '',
			},
		} );
	} );

	it( 'returns an empty string by default', () => {
		expect( getShareMessage() ).toBe( '' );
	} );

	it( 'returns the message saved in post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_publicize_message: 'test message',
			},
		} );

		expect( getShareMessage() ).toBe( 'test message' );
	} );

	it( 'truncates the message to the max length', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_publicize_message: 'aaa'.repeat( 500 ),
			},
		} );

		expect( getShareMessage() ).toBe( 'a'.repeat( getShareMessageMaxLength() ) );
	} );
} );
