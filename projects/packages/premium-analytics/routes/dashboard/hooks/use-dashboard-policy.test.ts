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
 * Seed the script data the dashboard reads its policy from.
 *
 * @param isAutomattician - The Automattician signal, omitted to leave the block absent.
 */
function seedScriptData( isAutomattician?: boolean ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		value:
			isAutomattician === undefined
				? {}
				: { premium_analytics: { is_automattician: isAutomattician } },
		configurable: true,
		writable: true,
	} );
}

describe( 'useDashboardPolicy', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'offers insert and remove to an Automattician', () => {
		seedScriptData( true );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
	} );

	it( 'withholds insert and remove from everyone else', () => {
		seedScriptData( false );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
	} );

	it( 'withholds them when the script data carries no answer', () => {
		seedScriptData();
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
	} );

	it( 'allows the operations it does not govern', () => {
		seedScriptData( false );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'reset' } ) ).toBe( true );
		expect( result.current( { operation: 'move', widget } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget } ) ).toBe( true );
		expect( result.current( { operation: 'edit', widget } ) ).toBe( true );
	} );

	it( 'keeps the same callback across renders', () => {
		seedScriptData( true );
		const { result, rerender } = renderHook( () => useDashboardPolicy() );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );
} );
