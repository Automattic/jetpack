import { renderHook } from '@testing-library/react';
import { useSearch } from '@wordpress/route';
import { createReportOriginSearch } from '@jetpack-premium-analytics/routing';
import { useDetailBreadcrumbs } from './use-detail-breadcrumbs';

jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
} ) );

const mockUseSearch = useSearch as jest.MockedFunction< typeof useSearch >;

const REPORT_WINDOW = { from: '2026-06-01', to: '2026-06-16' };

/**
 * Point the mocked router at a search object, optionally carrying an origin.
 *
 * @param report  - The referring report id.
 * @param section - The referring report's section.
 */
function mockSearch( report?: string, section?: string ) {
	mockUseSearch.mockReturnValue( {
		...REPORT_WINDOW,
		post_id: '42',
		...( report ? createReportOriginSearch( report, section ) : {} ),
	} as never );
}

/**
 * Assert the destination and search params for a report breadcrumb.
 *
 * @param link    - Breadcrumb destination.
 * @param report  - Expected report id.
 * @param section - Expected report section.
 */
function expectReportLink( link: string | undefined, report: string, section?: string ) {
	const url = new URL( link ?? '', 'https://example.com' );

	expect( url.pathname ).toBe( `/reports/${ report }` );
	expect( Object.fromEntries( url.searchParams ) ).toEqual( {
		...REPORT_WINDOW,
		...( section ? { section } : {} ),
	} );
}

const validOrigins = [
	[ 'posts', 'All pages', 'archives' ],
	[ 'videos', 'Videos', undefined ],
	[ 'emails', 'Emails', undefined ],
	[ 'comments', 'All comments', 'posts' ],
	[ 'authors', 'Top authors', undefined ],
	[ 'comment-followers', 'Comments Subscribers', undefined ],
	[ 'utm', 'All UTM values', 'campaign' ],
] as const;

/**
 * Point the script data at a site with or without VideoPress. `videos` is only a
 * valid origin on sites running VideoPress, and the report registry reads that
 * from script data.
 *
 * @param hasVideoPress - Whether the site runs VideoPress.
 */
function setVideoPress( hasVideoPress: boolean ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: { has_videopress: hasVideoPress } },
	} );
}

describe( 'useDetailBreadcrumbs', () => {
	beforeEach( () => {
		setVideoPress( true );
	} );

	afterAll( () => {
		delete window.JetpackScriptData;
	} );

	it.each( validOrigins )(
		'adds the %s report before the detail title',
		( report, label, section ) => {
			mockSearch( report, section );

			const { result } = renderHook( () => useDetailBreadcrumbs( 'Detail title' ) );

			expect( result.current.map( item => item.label ) ).toEqual( [ label, 'Detail title' ] );
			expectReportLink( result.current[ 0 ].to, report, section );
			expect( result.current[ 1 ].to ).toBeUndefined();
		}
	);

	it.each( [
		[ 'an unknown section', 'comments', 'bogus' ],
		[ 'a section unsupported by its report', 'videos', 'posts' ],
	] )( 'omits %s from the report link', ( _case, report, section ) => {
		expect.assertions( 2 );
		mockSearch( report, section );

		const { result } = renderHook( () => useDetailBreadcrumbs( 'Detail title' ) );

		expectReportLink( result.current[ 0 ].to, report );
	} );

	it( 'returns only the title crumb when no origin is present', () => {
		mockSearch();

		const { result } = renderHook( () => useDetailBreadcrumbs( 'Detail title' ) );

		expect( result.current ).toEqual( [ { label: 'Detail title' } ] );
	} );

	// `?origin=videos` can outlive VideoPress being turned off, so an unavailable
	// report must be as unlinkable as an unknown one — else the crumb outruns the guard.
	it( 'drops the videos crumb on a site without VideoPress', () => {
		setVideoPress( false );
		mockSearch( 'videos' );

		const { result } = renderHook( () => useDetailBreadcrumbs( 'A video' ) );

		expect( result.current ).toEqual( [ { label: 'A video' } ] );
	} );

	// The origin is untrusted: it is a plain query param anyone can edit, so an
	// inherited object property must not read as a report either.
	it.each( [ 'bogus', 'constructor', 'toString' ] )( 'ignores the %s report id', report => {
		mockSearch( report );

		const { result } = renderHook( () => useDetailBreadcrumbs( 'Detail title' ) );

		expect( result.current ).toEqual( [ { label: 'Detail title' } ] );
	} );
} );
