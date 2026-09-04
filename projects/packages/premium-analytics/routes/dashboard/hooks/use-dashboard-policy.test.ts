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
 * Seed the dashboard block of the script data the policy reads.
 *
 * @param dashboard              - The block, omitted to leave the script data without one.
 * @param dashboard.role         - The role the server resolved.
 * @param dashboard.capabilities - One flag per operation, partial on purpose.
 */
function seedScriptData( dashboard?: {
	role: string;
	capabilities: Partial< Record< string, boolean > >;
} ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		value: dashboard ? { premium_analytics: { dashboard } } : {},
		configurable: true,
		writable: true,
	} );
}

const everything = {
	customize: true,
	insert: true,
	remove: true,
	move: true,
	resize: true,
	edit: true,
	reset: true,
};

describe( 'useDashboardPolicy', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'answers each operation from the capabilities the server sent', () => {
		seedScriptData( { role: 'automattician', capabilities: everything } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'customize' } ) ).toBe( true );
	} );

	it( 'withholds what the role was not granted', () => {
		seedScriptData( {
			role: 'editor',
			capabilities: { ...everything, insert: false, remove: false, reset: false },
		} );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'reset' } ) ).toBe( false );
		expect( result.current( { operation: 'move', widget } ) ).toBe( true );
	} );

	it( 'falls back to a reader without adding or removing when the server sent nothing', () => {
		seedScriptData();
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'resize', widget } ) ).toBe( true );
	} );

	it( 'fills the operations a partial answer leaves out from the same defaults', () => {
		seedScriptData( { role: 'administrator', capabilities: { insert: true } } );
		const { result } = renderHook( () => useDashboardPolicy() );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'edit', widget } ) ).toBe( true );
	} );

	it( 'keeps the same callback across renders', () => {
		seedScriptData( { role: 'automattician', capabilities: everything } );
		const { result, rerender } = renderHook( () => useDashboardPolicy() );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );
} );
