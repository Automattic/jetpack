import { CONNECTION_FROM, isStandardEntryPoint, isUnifiedConnectionFlow } from '../connection-from';

// Cases from Calypso's and WordPress.com's tests of their copies of the rule, plus `wpcom-connector`.
const VECTORS: [ string | null | undefined, boolean, boolean ][] = [
	[ 'jetpack-connector', false, true ],
	[ 'jetpack-onboarding', false, true ],
	[ 'my_jetpack_onboarding', true, true ],
	[ 'my_jetpack_products_backup', true, true ],
	[ 'jetpack2_stats_v2', true, true ],
	[ 'a_' + 'b'.repeat( 62 ), true, true ],
	[ 'a_' + 'b'.repeat( 63 ), false, false ],
	[ 'my-jetpack', false, false ],
	[ 'jetpack-onboarding-wizard', false, false ],
	[ 'woocommerce-core-profiler', false, false ],
	[ 'jetpack-x_y', false, false ],
	[ 'jetpack__stats', false, false ],
	[ 'jetpack_stats_', false, false ],
	[ '_jetpack_stats', false, false ],
	[ 'jetpack', false, false ],
	[ 'Jetpack_stats', false, false ],
	[ '2fa_notice', false, false ],
	[ 'jetpack_stats\n', false, false ],
	[ '', false, false ],
	[ null, false, false ],
	[ undefined, false, false ],
	[ 'wpcom-connector', false, false ],
];

describe( 'isStandardEntryPoint and isUnifiedConnectionFlow', () => {
	it.each( VECTORS )( '%p: standard %p, unified %p', ( from, standard, unified ) => {
		expect( isStandardEntryPoint( from ) ).toBe( standard );
		expect( isUnifiedConnectionFlow( from ) ).toBe( unified );
	} );
} );

describe( 'CONNECTION_FROM', () => {
	// Each per-product function is sampled with one slug, so a new function is checked like a new name.
	const names = Object.values( CONNECTION_FROM ).map( value =>
		typeof value === 'string' ? value : value( 'backup' )
	);

	it( 'holds distinct names that WordPress.com sends to the unified flow', () => {
		expect( new Set( names ).size ).toBe( names.length );
		expect( names.filter( name => ! isUnifiedConnectionFlow( name ) ) ).toEqual( [] );
	} );

	it.each( [
		[ CONNECTION_FROM.myJetpackProducts, 'backup', 'my_jetpack_products_backup' ],
		[ CONNECTION_FROM.myJetpackProducts, 'anti-spam', 'my_jetpack_products_anti_spam' ],
		[ CONNECTION_FROM.myJetpackProducts, 'jetpack-ai', 'my_jetpack_products_ai' ],
		[ CONNECTION_FROM.myJetpackProducts, 'ai', 'my_jetpack_products_ai' ],
		[ CONNECTION_FROM.myJetpackProducts, 'jetpack-forms', 'my_jetpack_products_forms' ],
		[ CONNECTION_FROM.myJetpackRecommendations, 'scan', 'my_jetpack_recommendations_scan' ],
		[ CONNECTION_FROM.myJetpackFeatures, 'stats', 'my_jetpack_features_stats' ],
		[ CONNECTION_FROM.myJetpackFeatures, 'protect-dashboard', 'my_jetpack_features_protect' ],
		[ CONNECTION_FROM.myJetpackOverview, 'videopress', 'my_jetpack_overview_videopress' ],
	] )( 'names %p for slug %p as %p', ( toName, slug, expected ) => {
		expect( toName( slug ) ).toBe( expected );
	} );
} );
