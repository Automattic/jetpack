/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import {
	getDashboardSectionsPath,
	getPreloadedDashboardSections,
	normalizeDashboardSections,
	resolveSectionId,
	type DashboardSection,
} from './sections';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

const mockGetScriptData = getScriptData as jest.Mock;

const DASHBOARD_NAME = 'jetpack-premium-analytics_dashboard';
const SECTIONS_PATH = `/wpcom/v2/dashboards/${ DASHBOARD_NAME }/sections`;

const SERVER_SECTIONS: DashboardSection[] = [
	{ id: 'analytics/traffic', slug: 'traffic', label: 'Traffic', order: 10 },
	{ id: 'analytics/insights', slug: 'insights', label: 'Insights', order: 20 },
	{ id: 'analytics/subscribers', slug: 'subscribers', label: 'Subscribers', order: 30 },
	{ id: 'woocommerce/store', slug: 'store', label: 'Store', order: 40 },
];

/**
 * Point the mocked script data at a sections preload entry.
 *
 * @param body - Preloaded response body.
 * @param path - REST path the preload is keyed by.
 */
function mockPreload( body: unknown, path: string = SECTIONS_PATH ) {
	mockGetScriptData.mockReturnValue( {
		premium_analytics: {
			dashboard_sections_preload: { [ path ]: { body } },
		},
	} );
}

beforeEach( () => {
	mockGetScriptData.mockReset();
} );

describe( 'getDashboardSectionsPath', () => {
	it( 'builds the sections REST path for a dashboard', () => {
		expect( getDashboardSectionsPath( DASHBOARD_NAME ) ).toBe( SECTIONS_PATH );
	} );
} );

describe( 'normalizeDashboardSections', () => {
	it( 'keeps entries carrying the server section shape', () => {
		expect( normalizeDashboardSections( SERVER_SECTIONS ) ).toEqual( SERVER_SECTIONS );
	} );

	it( 'drops entries missing the section shape', () => {
		expect(
			normalizeDashboardSections( [
				SERVER_SECTIONS[ 0 ],
				{ id: 'analytics/broken', label: 'No slug', order: 20 },
				{ id: 'analytics/empty', slug: '', label: 'Empty slug', order: 30 },
				'not-a-section',
				null,
			] )
		).toEqual( [ SERVER_SECTIONS[ 0 ] ] );
	} );

	it( 'returns an empty list for non-array payloads', () => {
		expect( normalizeDashboardSections( undefined ) ).toEqual( [] );
		expect( normalizeDashboardSections( { sections: SERVER_SECTIONS } ) ).toEqual( [] );
	} );
} );

describe( 'getPreloadedDashboardSections', () => {
	it( 'reads the preload entry keyed by the dashboard sections path', () => {
		mockPreload( SERVER_SECTIONS );

		expect( getPreloadedDashboardSections( DASHBOARD_NAME ) ).toEqual( SERVER_SECTIONS );
	} );

	it( 'omits the store section when the server filtered it out', () => {
		// With WooCommerce inactive the registry's availability gate drops the
		// section server-side, so the preload simply does not carry it.
		mockPreload( SERVER_SECTIONS.slice( 0, 3 ) );

		expect( getPreloadedDashboardSections( DASHBOARD_NAME ).map( s => s.slug ) ).toEqual( [
			'traffic',
			'insights',
			'subscribers',
		] );
	} );

	it( 'surfaces a synthetic registered section', () => {
		// Any available section registered against the server registry renders,
		// proving the extension path works without frontend changes.
		mockPreload( [
			...SERVER_SECTIONS,
			{ id: 'acme/conversions', slug: 'conversions', label: 'Conversions', order: 50 },
		] );

		expect( getPreloadedDashboardSections( DASHBOARD_NAME ).map( s => s.slug ) ).toContain(
			'conversions'
		);
	} );

	it( 'returns an empty list when no preload is present', () => {
		mockGetScriptData.mockReturnValue( {} );

		expect( getPreloadedDashboardSections( DASHBOARD_NAME ) ).toEqual( [] );
	} );

	it( 'returns an empty list for a different dashboard name', () => {
		mockPreload( SERVER_SECTIONS );

		expect( getPreloadedDashboardSections( 'other_dashboard' ) ).toEqual( [] );
	} );
} );

describe( 'resolveSectionId', () => {
	it( 'keeps a slug matching an available section', () => {
		expect( resolveSectionId( 'insights', SERVER_SECTIONS ) ).toBe( 'insights' );
	} );

	it( 'falls back to the first section by order for stale or unavailable slugs', () => {
		const withoutStore = SERVER_SECTIONS.slice( 0, 3 );

		expect( resolveSectionId( 'store', withoutStore ) ).toBe( 'traffic' );
		expect( resolveSectionId( 'missing', SERVER_SECTIONS ) ).toBe( 'traffic' );
	} );

	it( 'falls back to the first section when no value is given', () => {
		expect( resolveSectionId( undefined, SERVER_SECTIONS ) ).toBe( 'traffic' );
	} );

	it( 'returns an empty slug when no sections are available yet', () => {
		expect( resolveSectionId( 'traffic', [] ) ).toBe( '' );
	} );
} );
