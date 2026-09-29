import { renderHook } from '@testing-library/react';
import { isDashboardCompositionEnabled, useDashboardPolicy } from './use-dashboard-policy';
import type { DashboardSection } from '../../config';
import type { WidgetType } from '@wordpress/widget-primitives';

const widgetType: WidgetType = {
	name: 'jpa/devices',
	title: 'Devices',
	renderModule: 'jpa/devices',
	apiVersion: 1,
};
const widget = { uuid: 'devices', type: widgetType.name } as const;

// Registered, and placed by no section.
const unplacedWidgetType: WidgetType = {
	...widgetType,
	name: 'jpa/post-views',
	title: 'Post views',
	renderModule: 'jpa/post-views',
};
const adsWidgetType: WidgetType = {
	...widgetType,
	name: 'wordads/chart-tabs',
	title: 'Ads summary',
	renderModule: 'wordads/chart-tabs',
};

const SECTIONS: DashboardSection[] = [
	{
		id: 'analytics/traffic',
		slug: 'traffic',
		label: 'Traffic',
		order: 10,
		default_layout: [ { uuid: 'default-devices', type: widgetType.name } ],
	},
	{
		id: 'wordads/ads',
		slug: 'ads',
		label: 'Ads',
		order: 50,
		default_layout: [ { uuid: 'default-ads', type: adsWidgetType.name } ],
	},
];

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
		const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );

		expect( result.current( { operation: 'customize' } ) ).toBe( true );
		expect( result.current( { operation: 'move', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'resize', widget, widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'edit', widget, widgetType } ) ).toBe( true );
	} );

	it( 'withholds adding and removing while the composition flag is off', () => {
		seedScriptData( { dashboard_composition_enabled: false } );
		const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( false );
	} );

	it( 'withholds them when the script data carries no answer', () => {
		seedScriptData();
		const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( result.current( { operation: 'move', widget } ) ).toBe( true );
	} );

	it( 'offers adding and removing while the flag is on', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( true );
		expect( result.current( { operation: 'remove', widget, widgetType } ) ).toBe( true );
	} );

	it( 'offers the types any section places by default, and no other', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );

		expect( result.current( { operation: 'insert', widgetType: adsWidgetType } ) ).toBe( true );
		expect( result.current( { operation: 'insert', widgetType: unplacedWidgetType } ) ).toBe(
			false
		);
	} );

	it( 'lets a placed widget of a type it does not offer be removed', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );
		const placed = { uuid: 'post-views', type: unplacedWidgetType.name };

		expect(
			result.current( { operation: 'remove', widget: placed, widgetType: unplacedWidgetType } )
		).toBe( true );
	} );

	it( 'offers nothing to insert while no section is available', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result } = renderHook( () => useDashboardPolicy( [] ) );

		expect( result.current( { operation: 'insert', widgetType } ) ).toBe( false );
	} );

	it.each( [ 'on', 'off' ] )(
		"denies the dashboard's own Reset to default with the composition flag %s",
		state => {
			seedScriptData( { dashboard_composition_enabled: state === 'on' } );
			const { result } = renderHook( () => useDashboardPolicy( SECTIONS ) );

			expect( result.current( { operation: 'reset' } ) ).toBe( false );
		}
	);

	it( 'keeps the same callback while the sections stay the same', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result, rerender } = renderHook( () => useDashboardPolicy( SECTIONS ) );
		const first = result.current;

		rerender();

		expect( result.current ).toBe( first );
	} );

	it( 'follows the sections when they change', () => {
		seedScriptData( { dashboard_composition_enabled: true } );
		const { result, rerender } = renderHook( ( { sections } ) => useDashboardPolicy( sections ), {
			initialProps: { sections: SECTIONS },
		} );

		rerender( { sections: SECTIONS.slice( 0, 1 ) } );

		expect( result.current( { operation: 'insert', widgetType: adsWidgetType } ) ).toBe( false );
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
