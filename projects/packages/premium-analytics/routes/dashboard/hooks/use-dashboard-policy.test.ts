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

	it( 'lets everyone customize by moving and resizing, and keep editing attributes', () => {
		seedScriptData( { dashboard_composition_enabled: false } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'edit', widget, widgetType } ) ).toBe( true );
	} );

	it( 'withholds adding, removing and resetting while the composition flag is off', () => {
		seedScriptData( { dashboard_composition_enabled: false } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'reset' } ) ).toBe( false );
	} );

	it( 'withholds them when the script data carries no answer', () => {
		seedScriptData();
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'move', widget } ) ).toBe( true );
	} );

	it( 'offers the full composition while the flag is on', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'reset' } ) ).toBe( true );
	} );

	it( 'keeps the same callback across renders', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result, rerender } = renderHook( () => useDashboardPolicy() );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );
} );
