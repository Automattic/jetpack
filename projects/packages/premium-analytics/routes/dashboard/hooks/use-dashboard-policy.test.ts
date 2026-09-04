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
 * Seed the facts the dashboard policy reads.
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

	it( 'offers move and remove to an Automattician on a sandboxed request', () => {
		seedScriptData( { is_automattician: true, is_sandboxed: true } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
	} );

	it.each( [
		[ 'an Automattician outside a sandbox', { is_automattician: true, is_sandboxed: false } ],
		[ 'a sandboxed request from anyone else', { is_automattician: false, is_sandboxed: true } ],
		[ 'a request with neither fact', { is_automattician: false, is_sandboxed: false } ],
	] )( 'withholds move and remove from %s', ( _label, facts ) => {
		seedScriptData( facts );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
	} );

	it( 'withholds them when the script data carries no facts', () => {
		seedScriptData();
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'move', widget } ) ).toBe( false );
	} );

	it( 'allows the operations it does not govern', () => {
		seedScriptData( { is_automattician: false, is_sandboxed: false } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'reset' } ) ).toBe( true );
		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget } ) ).toBe( true );
		expect( result.current( { operation: 'edit', widget } ) ).toBe( true );
	} );

	it( 'keeps the same callback across renders', () => {
		seedScriptData( { is_automattician: true, is_sandboxed: true } );
		const { result, rerender } = renderHook( () => useDashboardPolicy() );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );
} );
