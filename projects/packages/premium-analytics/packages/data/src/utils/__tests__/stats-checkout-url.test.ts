import { getStatsCheckoutUrl } from '../stats-checkout-url';

const site = {
	quantity: 100000,
	adminUrl: 'https://example.com/wp-admin/',
	siteSlug: 'example.com',
	blogId: 123,
	redirectPath: 'admin.php?page=jetpack-premium-analytics-wp-admin',
	backPath: 'admin.php?page=jetpack-premium-analytics-wp-admin&p=%2Fupgrade',
};

describe( 'getStatsCheckoutUrl', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[
			'a first purchase by a connected user',
			true,
			false,
			'/checkout/123/',
			'jetpack_premium_analytics_upsell',
		],
		[ 'an upgrade by a connected user', true, true, '/checkout/example.com/', null ],
		[ 'a purchase by an unconnected user', false, false, '/checkout/jetpack/', null ],
	] )( 'sends %s to the right checkout', ( _, isUserConnected, isUpgrade, path, source ) => {
		const url = new URL( getStatsCheckoutUrl( { ...site, isUserConnected, isUpgrade } ) );

		expect( url.pathname ).toBe( `${ path }jetpack_stats_yearly:-q-100000` );
		expect( url.searchParams.get( 'source' ) ).toBe( source );
		expect( url.searchParams.get( 'connect_after_checkout' ) ).toBe(
			isUserConnected ? null : 'true'
		);
		// Siteless checkout attaches the license to the site these name once the account links.
		expect( url.searchParams.get( 'from_site_slug' ) ).toBe(
			isUserConnected ? null : 'example.com'
		);
		expect( url.searchParams.get( 'admin_url' ) ).toBe(
			isUserConnected ? null : 'https://example.com/wp-admin/'
		);
	} );

	it( 'returns to the dashboard flagged as a paid purchase', () => {
		const url = new URL(
			getStatsCheckoutUrl( { ...site, isUserConnected: true, isUpgrade: false } )
		);
		const redirect = new URL( url.searchParams.get( 'redirect_to' ) ?? '' );

		expect( redirect.searchParams.get( 'page' ) ).toBe( 'jetpack-premium-analytics-wp-admin' );
		expect( redirect.searchParams.get( 'statsPurchaseSuccess' ) ).toBe( 'paid' );
	} );

	it( 'checks out on the Calypso the connection is set up for, so test environments can buy', () => {
		window.JetpackScriptData = {
			connection: { calypsoEnv: 'wpcalypso' },
		} as unknown as typeof window.JetpackScriptData;

		const url = new URL(
			getStatsCheckoutUrl( { ...site, isUserConnected: true, isUpgrade: false } )
		);

		expect( url.origin ).toBe( 'https://wpcalypso.wordpress.com' );
	} );
} );
