/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { useWidgetIdentity } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { useChartName, useMapName } from '../use-chart-name';

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetIdentity: jest.fn(),
} ) );

describe.each( [
	[ 'useChartName', useChartName, 'Chart' ],
	[ 'useMapName', useMapName, 'Map' ],
] as const )( '%s', ( _name, useName, prefix ) => {
	it.each( [
		[ 'the widget title', { title: 'Top posts' }, undefined, `${ prefix }: Top posts` ],
		[
			'its own title over the widget title',
			{ title: 'Top posts' },
			'Views',
			`${ prefix }: Views`,
		],
		[ 'nothing outside a widget', {}, undefined, undefined ],
	] )( 'names the chart after %s', ( _case, identity, chartTitle, expected ) => {
		jest.mocked( useWidgetIdentity ).mockReturnValue( identity );

		const { result } = renderHook( () => useName( chartTitle ) );

		expect( result.current ).toBe( expected );
	} );
} );
