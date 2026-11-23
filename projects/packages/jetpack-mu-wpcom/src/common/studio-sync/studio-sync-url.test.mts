import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildStudioSyncConnectUrl, takeStudioSyncParams } from './studio-sync-url.ts';

const DASHBOARD = 'https://example.com/wp-admin/';

describe( 'takeStudioSyncParams', () => {
	it( 'reads and strips the params, keeping the rest of the URL', () => {
		assert.deepEqual(
			takeStudioSyncParams( `${ DASHBOARD }?studioSiteId=abc&autoOpenPush=true&a=1` ),
			{
				params: { studioSiteId: 'abc', autoOpenPush: true },
				url: `${ DASHBOARD }?a=1`,
			}
		);
	} );

	it( 'returns null without a usable studioSiteId', () => {
		for ( const query of [ '', '?studioSiteId=', `?studioSiteId=${ 'a'.repeat( 65 ) }` ] ) {
			assert.equal( takeStudioSyncParams( DASHBOARD + query ), null );
		}
	} );
} );

it( 'buildStudioSyncConnectUrl encodes studioSiteId so it cannot add params', () => {
	const studioSiteId = 'abc&autoOpenPush=true';
	assert.equal(
		buildStudioSyncConnectUrl( { studioSiteId, remoteSiteId: 123, autoOpenPush: false } ),
		'wp-studio://sync-connect-site?studioSiteId=abc%26autoOpenPush%3Dtrue&remoteSiteId=123'
	);
} );
