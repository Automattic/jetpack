/**
 * External dependencies
 */
import { getLockedWidgetFeature } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	LOCKED_RENDER_MODULE_PREFIX,
	resolvePlanLockedWidgetModule,
	withPlanLockedRenderModules,
} from './plan-locked-widgets';
import type { WidgetType } from '@wordpress/widget-primitives';
import type { ReactElement } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	getLockedWidgetFeature: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	LockedWidget: () => null,
} ) );

const type = ( name: string ) =>
	( { name, title: name, renderModule: `${ name }/render` } ) as unknown as WidgetType;

describe( 'plan-locked widgets', () => {
	beforeEach( () => {
		jest
			.mocked( getLockedWidgetFeature )
			.mockImplementation( name => ( name === 'jpa/utm-insights' ? 'utm' : undefined ) );
	} );

	it( 'keeps a locked type registered but points it at the locked module', () => {
		const [ locked, open ] = withPlanLockedRenderModules( [
			type( 'jpa/utm-insights' ),
			type( 'jpa/referrers' ),
		] );

		expect( locked ).toMatchObject( {
			name: 'jpa/utm-insights',
			title: 'jpa/utm-insights',
			renderModule: `${ LOCKED_RENDER_MODULE_PREFIX }jpa/utm-insights`,
		} );
		expect( open.renderModule ).toBe( 'jpa/referrers/render' );
	} );

	it( 'drops the controls of a locked type that fetch their options, and keeps the static ones', () => {
		const getElements = jest.fn();
		const [ locked ] = withPlanLockedRenderModules( [
			{
				...type( 'jpa/utm-insights' ),
				attributes: [
					{ id: 'utmDimension', elements: [ { value: 'a', label: 'A' } ] },
					{ id: 'year', getElements },
				],
			} as unknown as WidgetType,
		] );

		expect( locked.attributes?.map( attribute => attribute.id ) ).toEqual( [ 'utmDimension' ] );
		expect( getElements ).not.toHaveBeenCalled();
	} );

	it( 'returns the same array when nothing is locked, so memoized consumers keep their identity', () => {
		jest.mocked( getLockedWidgetFeature ).mockReturnValue( undefined );
		const types = [ type( 'jpa/referrers' ) ];

		expect( withPlanLockedRenderModules( types ) ).toBe( types );
	} );

	it( 'resolves only locked ids, to the locked widget for their feature', () => {
		const locked = resolvePlanLockedWidgetModule(
			`${ LOCKED_RENDER_MODULE_PREFIX }jpa/utm-insights`
		)?.default as () => ReactElement;

		expect( locked().props ).toEqual( { feature: 'utm' } );
		expect( resolvePlanLockedWidgetModule( 'jpa/referrers/render' ) ).toBeUndefined();
	} );
} );
