import { describe, expect, beforeAll, test } from '@jest/globals';
import { CacheNotLoggedInOptions, updateSettings } from '../../lib/plugin-settings';
import { authenticatedRequest, getAuthCookie, getSiteUrl } from '../../lib/plugin-tools';
import { loadPage } from '../../lib/test-tools';
import { resetEnvironmnt, wpcli } from '../../lib/wordpress-tools';

let authCookie: string;

describe( 'wp_cache_not_logged_in settings', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );

		authCookie = await getAuthCookie();
		await updateSettings( authCookie, {
			wp_cache_enabled: true,
		} );
	} );

	test( 'logged in users get cached pages when "Enable caching for all visitors"', async () => {
		await updateSettings( authCookie, {
			wp_cache_not_logged_in: CacheNotLoggedInOptions.EnableForAllVisitors,
		} );

		const url = getSiteUrl();

		const first = await authenticatedRequest( authCookie, 'GET', url );
		const second = await authenticatedRequest( authCookie, 'GET', url );

		expect( first ).toBe( second );
	} );

	test( 'wp-admin is never cached, even when "Enable caching for all visitors"', async () => {
		await updateSettings( authCookie, {
			wp_cache_not_logged_in: CacheNotLoggedInOptions.EnableForAllVisitors,
		} );

		const url = getSiteUrl( '/wp-admin/' );

		const first = await authenticatedRequest( authCookie, 'GET', url );
		const second = await authenticatedRequest( authCookie, 'GET', url );

		expect( first ).not.toBe( second );
	} );

	test( 'users with any cookie do not get cached when "Disable caching for visitors who have a cookie"', async () => {
		await updateSettings( authCookie, {
			wp_cache_not_logged_in: CacheNotLoggedInOptions.DisableForAnyCookie,
		} );

		const cookie = 'cooookie: OMNOMNOM';
		const url = getSiteUrl();

		const first = await authenticatedRequest( cookie, 'GET', url );
		const second = await authenticatedRequest( cookie, 'GET', url );

		expect( first ).not.toBe( second );
	} );

	test( 'users with no cookie get cached when "Disable caching for visitors who have a cookie"', async () => {
		await updateSettings( authCookie, {
			wp_cache_not_logged_in: CacheNotLoggedInOptions.DisableForAnyCookie,
		} );

		const first = await loadPage();
		const second = await loadPage();

		expect( first ).toBe( second );
	} );

	test( 'logged in users do not get cached pages when "Disable caching for logged in visitors"', async () => {
		await updateSettings( authCookie, {
			wp_cache_not_logged_in: CacheNotLoggedInOptions.DisableForLoggedIn,
		} );

		const url = getSiteUrl();

		const first = await authenticatedRequest( authCookie, 'GET', url );
		const second = await authenticatedRequest( authCookie, 'GET', url );

		expect( first ).not.toBe( second );
	} );
} );
