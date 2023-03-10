import * as data from '@wordpress/data';
import {
	getEditorType,
	CUSTOMIZER_EDITOR,
	NAVIGATION_EDITOR,
	POST_EDITOR,
	SITE_EDITOR,
	UNKNOWN_EDITOR,
	WIDGET_EDITOR,
} from '../get-editor-type';

const testCaseMap = [
	{
		name: 'When in site editor context we get the corresponding value',
		store: 'core/edit-site',
		context: SITE_EDITOR,
	},
	{
		name: 'When we are in widget editor we get the corresponding context value',
		store: 'core/edit-widgets',
		context: WIDGET_EDITOR,
	},
	{
		name: 'When we are in customizer editor we get the corresponding context value',
		store: 'core/customize-widgets',
		context: CUSTOMIZER_EDITOR,
	},
	{
		name: 'When we are in navigation editor we get the corresponding context value',
		store: 'core/edit-navigation',
		context: NAVIGATION_EDITOR,
	},
	{
		name:
			'When we are not in any of the other editors and the core/editor store is available we return post editor context',
		store: 'core/edit-post',
		context: POST_EDITOR,
	},
	{
		name: 'When we are in an unknown editor we get post editor context value',
		store: 'any-store',
		context: UNKNOWN_EDITOR,
	},
];

describe( 'Gutenberg context resolution', () => {
	const getMockImplementationForStore = store => storeArgument => {
		return store === storeArgument;
	};

	test.each( testCaseMap )( '$name', testCase => {
		// Given
		const context = testCase.context;
		const mock = jest
			.spyOn( data, 'select' )
			.mockImplementation( getMockImplementationForStore( testCase.store ) );

		// When
		const editorType = getEditorType();

		// Then
		expect( editorType ).toEqual( context );
		mock.mockReset();
	} );
} );
