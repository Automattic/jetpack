import { renderHook } from '@testing-library/react';
import { isDashboardCompositionEnabled, useDashboardPolicy } from './use-dashboard-policy';
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

/**
 * Seed the flag's answer the dashboard policy reads.
 *
 * @param facts - The `premium_analytics` block, omitted to leave the script data without one.
 */
function seedScriptData( facts?: Record< string, boolean > ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		value: facts ? { premium_analytics: facts } : {},
		configurable: true,
		writable: true,
	} );
}

describe( 'useDashboardPolicy', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'lets everyone customize, move and resize, and keep editing attributes', () => {
		seedScriptData( { dashboard_composition_enabled: false } );
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'edit', widget, widgetType } ) ).toBe( true );
	} );

	it( 'withholds adding and removing while the composition flag is off', () => {
		seedScriptData( { dashboard_composition_enabled: false } );
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
	} );

	it( 'withholds them when the script data carries no answer', () => {
		seedScriptData();
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'move', widget } ) ).toBe( true );
	} );

	it( 'offers adding and removing while the flag is on', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
	} );

	it( 'offers the insertable types, and no other', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'insert', widgetType: otherWidgetType } ) ).toBe( false );
	} );

	it( 'lets a placed widget of a type it does not offer be removed', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );
		const placed = { uuid: 'post-views', type: otherWidgetType.name };

		expect(
			result.current( { operation: 'remove', widget: placed, widgetType: otherWidgetType } )
		).toBe( true );
	} );

	it( 'offers nothing to insert without insertable types', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () =>
			useDashboardPolicy( { insertableWidgetTypes: new Set() } )
		);

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
	} );

	it.each( [ 'on', 'off' ] )(
		"denies the dashboard's own Reset to default with the composition flag %s",
		state => {
			seedScriptData( { dashboard_composition_enabled: state === 'on' } );
			const { result } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );

			expect( result.current( { operation: 'reset' } ) ).toBe( false );
		}
	);

	it( 'keeps the same callback while the insertable types stay the same', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result, rerender } = renderHook( () => useDashboardPolicy( POLICY_INPUTS ) );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );

	it( 'follows the insertable types when they change', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result, rerender } = renderHook( inputs => useDashboardPolicy( inputs ), {
			initialProps: POLICY_INPUTS,
		} );

		rerender( { insertableWidgetTypes: new Set( [ otherWidgetType.name ] ) } );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'insert', widgetType: otherWidgetType } ) ).toBe( true );
	} );
} );

describe( 'isDashboardCompositionEnabled', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'answers the flag, and off without one', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		expect( isDashboardCompositionEnabled() ).toBe( true );

		seedScriptData();
		expect( isDashboardCompositionEnabled() ).toBe( false );
	} );
} );
