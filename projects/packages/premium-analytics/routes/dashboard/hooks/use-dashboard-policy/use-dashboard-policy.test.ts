import { renderHook } from '@testing-library/react';
import { useDashboardPolicy } from './use-dashboard-policy';
import type { WidgetType } from '@wordpress/widget-primitives';

const widgetType: WidgetType = {
	name: 'jpa/devices',
	title: 'Devices',
	renderModule: 'jpa/devices',
	apiVersion: 1,
};
const widget = { uuid: 'devices', type: widgetType.name } as const;

// Registered, and left out of the insertable types.
const otherWidgetType: WidgetType = {
	...widgetType,
	name: 'jpa/post-views',
	title: 'Post views',
	renderModule: 'jpa/post-views',
};

const POLICY_INPUTS = { insertableWidgetTypes: new Set( [ widgetType.name ] ) };

describe( 'useDashboardPolicy', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'lets everyone customize, move and resize, and keep editing attributes', () => {
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'edit', widget, widgetType } ) ).toBe( true );
	} );

	it( 'keeps plan-locked types out of the inserter, but lets their placed widgets keep their controls', () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			value: {
				premium_analytics: {
					plan_gates: {
						tier: 'paid',
						locked_features: { devices: { description: '', support_url: '', upgrade_url: '' } },
						locked_widget_types: { [ widgetType.name ]: 'devices' },
					},
				},
			},
			configurable: true,
			writable: true,
		} );
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'edit', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
	} );

	it( 'lets a locked section move and resize its open widgets, but not add or remove one', () => {
		const { result } = renderHook( () =>
			useDashboardPolicy( { ...POLICY_INPUTS, lockedLayout: [ widget ] } )
		);

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
	} );

	it( 'offers no Customize on a locked section that shows no widget', () => {
		const { result } = renderHook( () =>
			useDashboardPolicy( { ...POLICY_INPUTS, lockedLayout: [] } )
		);

		expect( result.current( { operation: 'customize' } ) ).toBe( false );
	} );

	it( 'offers the insertable types, and no other', () => {
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'insert', widgetType: otherWidgetType } ) ).toBe( false );
	} );

	it( 'lets a placed widget of a type it does not offer be removed', () => {
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );
		const placed = { uuid: 'post-views', type: otherWidgetType.name };

		expect(
			result.current( { operation: 'remove', widget: placed, widgetType: otherWidgetType } )
		).toBe( true );
	} );

	it( 'offers nothing to insert without insertable types', () => {
		const { result } = renderHook( () =>
			useDashboardPolicy( { insertableWidgetTypes: new Set() } )
		);

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
	} );

	it( "denies the dashboard's own Reset to default", () => {
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'reset' } ) ).toBe( false );
	} );

	it( 'keeps the same callback while the insertable types stay the same', () => {
		const { result, rerender } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );

	it( 'follows the insertable types when they change', () => {
		const { result, rerender } = renderHook( inputs => useDashboardPolicy( inputs ), {
			initialProps: POLICY_INPUTS,
		} );

		rerender( { insertableWidgetTypes: new Set( [ otherWidgetType.name ] ) } );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'insert', widgetType: otherWidgetType } ) ).toBe( true );
	} );
} );
