/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useWidgetModules } from './use-widget-modules';

const mockGetEntityRecords = jest.fn( () => [] );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( { getEntityRecords: mockGetEntityRecords } ) ),
} ) );

describe( 'useWidgetModules', () => {
	it( 'asks core-data for every widget module, not its default first page', () => {
		renderHook( () => useWidgetModules() );

		expect( mockGetEntityRecords ).toHaveBeenCalledWith( 'root', 'widgetModule', {
			per_page: -1,
		} );
	} );
} );
