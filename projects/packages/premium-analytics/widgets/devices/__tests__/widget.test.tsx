/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../tests/js/route-test-utils';
import widget, { type DevicesAttributes } from '../widget';
import type { ComponentType } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

describe( 'Devices interval menu', () => {
	afterEach( () => setMockRouteSearch( {} ) );

	it.each( [
		[ 'hides', { chartType: 'half-ring' as const }, false ],
		[ 'hides', {}, false ],
		[ 'shows', { chartType: 'bar' as const }, true ],
	] )( '%s the menu for %j', ( _verb, data: DevicesAttributes, shown ) => {
		setMockRouteSearch( { preset: 'last-30-days' } );
		const field = widget.attributes.find( attribute => attribute.id === 'chartInterval' );
		const Menu = field?.Edit as unknown as ComponentType< {
			data: DevicesAttributes;
			field: typeof field;
			onChange: () => void;
		} >;

		render( <Menu data={ data } field={ field } onChange={ jest.fn() } /> );

		expect( Boolean( screen.queryByRole( 'button', { name: /^By / } ) ) ).toBe( shown );
	} );
} );
