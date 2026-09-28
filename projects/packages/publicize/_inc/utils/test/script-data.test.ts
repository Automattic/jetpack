import { getSimpleSiteUpgradeUrl, getUpgradePlanName } from '../script-data';
import type { JetpackScriptData } from '@automattic/jetpack-script-data';

type TestScriptData = Partial< JetpackScriptData > & Record< string, unknown >;

/**
 * Install a fake `window.JetpackScriptData` for the duration of one test.
 *
 * Raw rather than `mockScriptData()`, which fills in defaults for exactly the keys
 * these cases turn on being absent.
 *
 * @param data - The script data to expose.
 */
function setScriptData( data: TestScriptData ) {
	( window as unknown as { JetpackScriptData: TestScriptData } ).JetpackScriptData = data;
}

/**
 * Script data for a WordPress.com Simple site, the only type with a plans-page path.
 *
 * @param upgrade - The `social.upgrade` payload, omitted entirely when null.
 * @return The script data.
 */
function simpleSiteScriptData(
	upgrade: { plan_slug: string; plan_name: string | null } | null = {
		plan_slug: 'business-bundle',
		plan_name: 'Business',
	}
): TestScriptData {
	return {
		site: { host: 'wpcom', suffix: 'example.wordpress.com' },
		social: upgrade ? { upgrade } : {},
	} as TestScriptData;
}

afterEach( () => {
	setScriptData( {} );
} );

describe( 'getSimpleSiteUpgradeUrl', () => {
	it( 'returns null on a self-hosted Jetpack site', () => {
		setScriptData( {
			site: { host: 'unknown', suffix: 'example.com' },
			social: {},
		} as TestScriptData );

		expect(
			getSimpleSiteUpgradeUrl( 'social-enhanced-publishing', 'https://example.com/wp-admin/' )
		).toBeNull();
	} );

	it( 'returns null on a WoA site', () => {
		setScriptData( {
			site: { host: 'woa', suffix: 'example.com' },
			social: {},
		} as TestScriptData );

		expect(
			getSimpleSiteUpgradeUrl( 'social-enhanced-publishing', 'https://example.com/wp-admin/' )
		).toBeNull();
	} );

	it( 'points a Simple site at the WordPress.com plans page for the required plan', () => {
		setScriptData( simpleSiteScriptData() );

		const url = new URL(
			getSimpleSiteUpgradeUrl(
				'social-enhanced-publishing',
				'https://example.wordpress.com/wp-admin/admin.php?page=jetpack-social'
			)
		);

		expect( url.origin + url.pathname ).toBe( 'https://wordpress.com/plans/example.wordpress.com' );
		expect( url.searchParams.get( 'plan' ) ).toBe( 'business-bundle' );
		expect( url.searchParams.get( 'feature' ) ).toBe( 'social-enhanced-publishing' );
		expect( url.searchParams.get( 'redirect_to' ) ).toBe(
			'https://example.wordpress.com/wp-admin/admin.php?page=jetpack-social'
		);
	} );

	it( 'omits the site from the plans URL when the suffix is unknown', () => {
		setScriptData( {
			site: { host: 'wpcom' },
			social: { upgrade: { plan_slug: 'business-bundle', plan_name: 'Business' } },
		} as TestScriptData );

		const url = new URL(
			getSimpleSiteUpgradeUrl( 'social-enhanced-publishing', 'https://example.wordpress.com/' )
		);

		expect( url.origin + url.pathname ).toBe( 'https://wordpress.com/plans' );
	} );

	it( 'still links to the plans page when the plan slug is unavailable', () => {
		setScriptData( simpleSiteScriptData( null ) );

		const url = new URL(
			getSimpleSiteUpgradeUrl( 'social-enhanced-publishing', 'https://example.wordpress.com/' )
		);

		expect( url.origin + url.pathname ).toBe( 'https://wordpress.com/plans/example.wordpress.com' );
		expect( url.searchParams.has( 'plan' ) ).toBe( false );
	} );
} );

describe( 'getUpgradePlanName', () => {
	it( 'returns the plan short name piped through script data', () => {
		setScriptData( simpleSiteScriptData() );

		expect( getUpgradePlanName() ).toBe( 'Business' );
	} );

	it( 'returns null when the site has no upgrade path', () => {
		setScriptData( {
			site: { host: 'unknown', suffix: 'example.com' },
			social: {},
		} as TestScriptData );

		expect( getUpgradePlanName() ).toBeNull();
	} );

	it( 'returns null when the plan name could not be resolved', () => {
		setScriptData( simpleSiteScriptData( { plan_slug: 'business-bundle', plan_name: null } ) );

		expect( getUpgradePlanName() ).toBeNull();
	} );
} );
