import { CONNECTION_FROM, isStandardEntryPoint, isUnifiedConnectionFlow } from '../connection-from';

// The shared test vectors that Calypso's and WordPress.com's copies of the rule also pass.
const VECTORS: [ string | null | undefined, boolean, boolean ][] = [
	[ 'jetpack-connector', false, true ],
	[ 'jetpack-onboarding', false, true ],
	[ 'my_jetpack_onboarding', true, true ],
	[ 'my_jetpack_products_backup', true, true ],
	[ 'a_' + 'b'.repeat( 62 ), true, true ],
	[ 'a_' + 'b'.repeat( 63 ), false, false ],
	[ 'my-jetpack', false, false ],
	[ 'jetpack-onboarding-wizard', false, false ],
	[ 'woocommerce-core-profiler', false, false ],
	[ 'jetpack-x_y', false, false ],
	[ 'jetpack__stats', false, false ],
	[ 'jetpack_stats_', false, false ],
	[ '_jetpack_stats', false, false ],
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
	const fixedNames = Object.values( CONNECTION_FROM ).flatMap( value =>
		typeof value === 'string' ? [ value ] : []
	);

	it( 'holds distinct names that WordPress.com sends to the unified flow', () => {
		expect( new Set( fixedNames ).size ).toBe( fixedNames.length );
		expect( fixedNames.filter( name => ! isUnifiedConnectionFlow( name ) ) ).toEqual( [] );
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
