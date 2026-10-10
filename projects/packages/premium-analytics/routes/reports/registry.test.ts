/**
 * Internal dependencies
 */
import { getReportDefinition, REPORTS } from './registry';

/**
 * Publish the script data of a Simple site running VideoPress, with any overrides applied.
 *
 * @param options          - Overrides.
 * @param options.host     - Site host; anything but `wpcom` is non-Simple.
 * @param options.sections - URL-facing slugs of the tabs the dashboard exposes.
 * @param options.videos   - Whether the site runs VideoPress.
 */
function setSite( {
	host = 'wpcom',
	sections,
	videos = true,
}: { host?: string; sections?: string[]; videos?: boolean } = {} ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { site: { host }, premium_analytics: { has_videopress: videos, sections } },
	} );
}

describe( 'getReportDefinition', () => {
	beforeEach( () => {
		setSite();
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'returns undefined for an unknown report', () => {
		expect( getReportDefinition( 'unknown' ) ).toBeUndefined();
		expect( getReportDefinition( undefined ) ).toBeUndefined();
	} );

	// The id comes from the URL, so an inherited object property must not read
	// as a report.
	it( 'returns undefined for the inherited constructor property', () => {
		expect( getReportDefinition( 'constructor' ) ).toBeUndefined();
	} );

	it( 'returns the downloads report on Simple sites', () => {
		expect( getReportDefinition( 'downloads' )?.id ).toBe( 'downloads' );
	} );

	it( 'hides the downloads report on non-Simple sites', () => {
		// Calypso shows file downloads only on Simple sites; an unavailable report
		// gets the same route-guard redirect as an unknown one.
		setSite( { host: 'unknown' } );

		expect( getReportDefinition( 'downloads' ) ).toBeUndefined();
	} );

	it( 'keeps other reports available on non-Simple sites', () => {
		setSite( { host: 'unknown' } );

		expect( getReportDefinition( 'posts' )?.id ).toBe( 'posts' );
	} );

	it( 'returns the videos report on sites running VideoPress', () => {
		expect( getReportDefinition( 'videos' )?.id ).toBe( 'videos' );
	} );

	it( 'hides the videos report without VideoPress', () => {
		setSite( { videos: false } );

		expect( getReportDefinition( 'videos' ) ).toBeUndefined();
	} );

	it( 'hides a report whose tab the dashboard does not expose', () => {
		setSite( { sections: [ 'traffic' ] } );

		expect( getReportDefinition( 'comments' ) ).toBeUndefined();
		expect( getReportDefinition( 'emails' ) ).toBeUndefined();
		// The Ads tab carries its own availability gate (WordAds active, and the
		// user can read ad reports), which reaches this report only through the published tabs.
		expect( getReportDefinition( 'earnings' ) ).toBeUndefined();
	} );

	it( 'opens a report once its tab is available', () => {
		setSite( { sections: [ 'traffic', 'insights' ] } );

		expect( getReportDefinition( 'comments' )?.id ).toBe( 'comments' );
		expect( getReportDefinition( 'emails' ) ).toBeUndefined();
	} );
} );

describe( 'REPORTS', () => {
	/**
	 * Group the registry by the tab each report declares.
	 *
	 * @return Report ids keyed by their `dashboardSection`.
	 */
	function reportsBySection() {
		const grouped: Record< string, string[] > = {};

		for ( const [ id, report ] of Object.entries( REPORTS ) ) {
			( grouped[ report.dashboardSection ] ??= [] ).push( id );
		}

		return grouped;
	}

	it( 'keys every report by its own id', () => {
		const misKeyed = Object.entries( REPORTS )
			.filter( ( [ key, { id } ] ) => key !== id )
			.map( ( [ key ] ) => key );

		expect( misKeyed ).toEqual( [] );
	} );

	// Most reports are Traffic, so a new one lands on the right tab by accident far more
	// often than by intent; a wrong tab is silent until a hidden tab hides the report.
	it( 'places every report on its intended tab', () => {
		expect( reportsBySection() ).toEqual( {
			traffic: [
				'authors',
				'clicks',
				'downloads',
				'locations',
				'posts',
				'search-terms',
				'videos',
				'utm',
				'referrers',
			],
			insights: [ 'annual-insights', 'comments', 'tags' ],
			subscribers: [ 'comment-followers', 'emails' ],
			ads: [ 'earnings' ],
		} );
	} );
} );
