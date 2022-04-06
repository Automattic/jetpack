/**
 * WordPress dependencies
 */
import * as data from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
    getGutenbergContext, CUSTOMIZER_EDITOR_CONTEXT,
    NAVIGATION_EDITOR_CONTEXT, POST_EDITOR_CONTEXT,
    SITE_EDITOR_CONTEXT, UNKNOWN_EDITOR_CONTEXT,
    WIDGET_EDITOR_CONTEXT
} from "../components/gutenberg/context/resolver";

const testCaseMap = [
    {
        name: 'When in site editor context we get the corresponding value',
        store: 'core/edit-site',
        context: SITE_EDITOR_CONTEXT,
    },
    {
        name: 'When we are in widget editor we get the corresponding context value',
        store: 'core/edit-widgets',
        context: WIDGET_EDITOR_CONTEXT,
    },
    {
        name: 'When we are in customizer editor we get the corresponding context value',
        store: 'core/customize-widgets',
        context: CUSTOMIZER_EDITOR_CONTEXT,
    },
    {
        name: 'When we are in navigation editor we get the corresponding context value',
        store: 'core/edit-navigation',
        context: NAVIGATION_EDITOR_CONTEXT,
    },
    {
        name: 'When we are not in any of the other editors and the core/editor store is available we return post editor context',
        store: 'core/editor',
        context: POST_EDITOR_CONTEXT,
    },
    {
        name: 'When we are in an unknown editor we get post editor context value',
        store: 'any-store',
        context: UNKNOWN_EDITOR_CONTEXT,
    },
];

describe( 'Gutenberg context resolution', () => {

    const getMockImplementationForStore = ( store ) => ( storeArgument ) => {
        return store === storeArgument;
    }

    testCaseMap.forEach( ( testCase ) => {
        test( testCase.name, () => {
            // Given
            const context = testCase.context;
            const mock = jest.spyOn( data, 'select' )
                .mockImplementation( getMockImplementationForStore( testCase.store ) );

            // When
            const gutenbergContext = getGutenbergContext();

            // Then
            expect( gutenbergContext ).toEqual( context );
            mock.mockReset();
        });
    } );
} );

