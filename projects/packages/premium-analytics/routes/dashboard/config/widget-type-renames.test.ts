/**
 * Internal dependencies
 */
import {
	NO_WIDGET_TYPE_RENAMES,
	buildWidgetTypeRenames,
	resolveLayoutTypes,
	type WidgetTypeName,
} from './widget-type-renames';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

describe( 'buildWidgetTypeRenames', () => {
	it( 'maps every former name to the record that claims it', () => {
		const renames = buildWidgetTypeRenames( [
			{ name: 'videopress/top-videos', former_names: [ 'jpa/videopress' ] },
			{ name: 'jpa/clicks', former_names: null },
			{ name: 'wordads/highlights' },
		] );

		expect( [ ...renames ] ).toEqual( [ [ 'jpa/videopress', 'videopress/top-videos' ] ] );
	} );

	it( 'shares one empty map while there is nothing to rename', () => {
		expect( buildWidgetTypeRenames( null ) ).toBe( NO_WIDGET_TYPE_RENAMES );
		expect( buildWidgetTypeRenames( [ { name: 'jpa/clicks' } ] ) ).toBe( NO_WIDGET_TYPE_RENAMES );
	} );

	it( 'ignores a record whose former names are not a list', () => {
		const keyed = { 0: 'jpa/videopress', 2: 'jpa/videos' } as unknown as string[];

		expect(
			buildWidgetTypeRenames( [ { name: 'videopress/top-videos', former_names: keyed } ] )
		).toBe( NO_WIDGET_TYPE_RENAMES );
	} );
} );

describe( 'resolveLayoutTypes', () => {
	const renames = new Map< string, WidgetTypeName >( [
		[ 'jpa/videopress', 'videopress/top-videos' ],
	] );

	it( 'renames only the items saved under a former name', () => {
		const layout: DashboardWidget[] = [
			{ uuid: 'videos', type: 'jpa/videopress', attributes: { view: 'plays' } },
			{ uuid: 'clicks', type: 'jpa/clicks' },
		];

		const resolved = resolveLayoutTypes( layout, renames );

		expect( resolved ).toEqual( [
			{ uuid: 'videos', type: 'videopress/top-videos', attributes: { view: 'plays' } },
			{ uuid: 'clicks', type: 'jpa/clicks' },
		] );
		expect( resolved[ 1 ] ).toBe( layout[ 1 ] );
	} );

	it( 'keeps the layout identity when nothing is renamed', () => {
		const layout: DashboardWidget[] = [ { uuid: 'clicks', type: 'jpa/clicks' } ];

		expect( resolveLayoutTypes( layout, renames ) ).toBe( layout );
		expect( resolveLayoutTypes( layout, NO_WIDGET_TYPE_RENAMES ) ).toBe( layout );
	} );
} );
