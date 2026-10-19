import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isMcpEnabled, showBanner } from './show-banner.ts';

const wpcomApi = { path: '/wpcom/v2/sites/123/mcp-abilities', format: 'wpcom' } as const;
const jetpackApi = { path: '/wpcom/v2/jetpack-ai/mcp-settings', format: 'jetpack' } as const;
const trackProps = { surface: 'dashboard' };

/**
 * Records the Tracks events showBanner sends.
 *
 * @return The recorder and the events it saw.
 */
function recorder() {
	const events: [ string, Record< string, string > ][] = [];
	return {
		events,
		track: ( name: string, props: Record< string, string > ) => events.push( [ name, props ] ),
	};
}

describe( 'isMcpEnabled', () => {
	it( 'reads site_level_enabled from the native endpoint', () => {
		assert.equal( isMcpEnabled( { site_level_enabled: true }, 'wpcom' ), true );
		assert.equal( isMcpEnabled( { site_level_enabled: false }, 'wpcom' ), false );
	} );

	it( 'reads the site entry from the Jetpack proxy', () => {
		const response = ( enabled: boolean ) => ( {
			has_mcp_access: true,
			mcp_abilities: { sites: [ { blog_id: 123, site_level_enabled: enabled } ] },
		} );

		assert.equal( isMcpEnabled( response( true ), 'jetpack' ), true );
		assert.equal( isMcpEnabled( response( false ), 'jetpack' ), false );
	} );

	it( 'treats a site without MCP access as having nothing to set up', () => {
		assert.equal( isMcpEnabled( { has_mcp_plan: false }, 'wpcom' ), true );
		assert.equal( isMcpEnabled( { has_mcp_access: false, mcp_abilities: [] }, 'jetpack' ), true );
	} );

	it( 'keeps the banner hidden when the response lacks an explicit off state', () => {
		assert.equal( isMcpEnabled( null, 'wpcom' ), true );
		assert.equal( isMcpEnabled( undefined, 'jetpack' ), true );
		assert.equal( isMcpEnabled( {}, 'wpcom' ), true );
		assert.equal( isMcpEnabled( { has_mcp_access: true }, 'jetpack' ), true );
	} );
} );

describe( 'showBanner', () => {
	it( 'records an impression right away when the banner is already visible', async () => {
		const banner = { hidden: false };
		const { events, track } = recorder();
		let fetched = false;

		await showBanner( banner, { trackProps, mcpSettingsApi: wpcomApi }, track, async () => {
			fetched = true;
		} );

		assert.equal( banner.hidden, false );
		assert.equal( fetched, false );
		assert.deepEqual( events, [ [ 'jetpack_ai_assistant_banner_impression', trackProps ] ] );
	} );

	it( 'shows a hidden banner while MCP access is off', async () => {
		const banner = { hidden: true };
		const { events, track } = recorder();
		const paths: string[] = [];

		await showBanner( banner, { trackProps, mcpSettingsApi: wpcomApi }, track, async path => {
			paths.push( path );
			return { site_level_enabled: false };
		} );

		assert.deepEqual( paths, [ wpcomApi.path ] );
		assert.equal( banner.hidden, false );
		assert.deepEqual( events, [ [ 'jetpack_ai_assistant_banner_impression', trackProps ] ] );
	} );

	it( 'keeps the banner hidden once MCP access is on', async () => {
		const banner = { hidden: true };
		const { events, track } = recorder();

		await showBanner( banner, { trackProps, mcpSettingsApi: jetpackApi }, track, async () => ( {
			has_mcp_access: true,
			mcp_abilities: { sites: [ { site_level_enabled: true } ] },
		} ) );

		assert.equal( banner.hidden, true );
		assert.deepEqual( events, [] );
	} );

	it( 'keeps the banner hidden when the check fails', async () => {
		const banner = { hidden: true };
		const { events, track } = recorder();

		await showBanner( banner, { trackProps, mcpSettingsApi: wpcomApi }, track, async () => {
			throw new Error( 'Request failed' );
		} );

		assert.equal( banner.hidden, true );
		assert.deepEqual( events, [] );
	} );

	it( 'keeps the banner hidden when the check returns incomplete data', async () => {
		const banner = { hidden: true };
		const { events, track } = recorder();

		await showBanner( banner, { trackProps, mcpSettingsApi: wpcomApi }, track, async () => ( {} ) );

		assert.equal( banner.hidden, true );
		assert.deepEqual( events, [] );
	} );

	it( 'keeps the banner hidden without an endpoint to check', async () => {
		const banner = { hidden: true };
		const { events, track } = recorder();

		await showBanner( banner, undefined, track );

		assert.equal( banner.hidden, true );
		assert.deepEqual( events, [] );
	} );

	it( 'falls back to apiFetch, and stays hidden when it cannot reach the endpoint', async () => {
		const banner = { hidden: true };
		const { events, track } = recorder();

		await showBanner( banner, { trackProps, mcpSettingsApi: wpcomApi }, track );

		assert.equal( banner.hidden, true );
		assert.deepEqual( events, [] );
	} );
} );
