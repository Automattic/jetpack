import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getImageGeneratorPostSettings } from '..';
import { initEditor, resetEditor } from '../test-utils';

describe( 'getImageGeneratorPostSettings', () => {
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

	it( 'returns the default object by default', () => {
		expect( getImageGeneratorPostSettings() ).toEqual( { enabled: false } );
	} );

	it( 'returns the values from post meta', () => {
		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					image_generator_settings: {
						enabled: false,
						template: 'test',
					},
				},
			},
		} );

		expect( getImageGeneratorPostSettings() ).toEqual( {
			enabled: false,
			template: 'test',
		} );

		dispatch( editorStore ).editPost( {
			meta: {
				jetpack_social_options: {
					image_generator_settings: {},
				},
			},
		} );

		expect( getImageGeneratorPostSettings() ).toEqual( {} );
	} );
} );
