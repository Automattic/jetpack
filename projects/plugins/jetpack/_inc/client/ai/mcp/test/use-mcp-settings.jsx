import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { normalizeWpcomMcpSettings, useMcpSettings } from '../use-mcp-settings';
import { mergeSiteMcpAbilities } from '../utils';

jest.mock( '@wordpress/api-fetch' );

const wpcomResponse = {
	has_mcp_plan: true,
	site_level_enabled: true,
	abilities: [
		{ name: 'wpcom/get-site', site_context: true, enabled: true },
		{ name: 'wpcom/get-account', site_context: false, enabled: true },
	],
	groups: [ { name: 'content' } ],
	user_overrides: {
		abilities: { 'wpcom/get-site': false },
		group_intents: { read: true },
	},
};

describe( 'useMcpSettings with the native WordPress.com API', () => {
	beforeEach( () => {
		window.jetpackAiSettings = {
			blogId: 123,
			mcpSettingsApi: {
				path: '/wpcom/v2/sites/123/mcp-abilities',
				format: 'wpcom',
			},
		};
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		jest.resetAllMocks();
	} );

	test( 'loads and normalizes native abilities', async () => {
		apiFetch.mockResolvedValueOnce( wpcomResponse );

		const { result } = renderHook( () => useMcpSettings() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/sites/123/mcp-abilities',
		} );
		expect( result.current.hasMcpAccess ).toBe( true );
		expect( result.current.mcpAbilities.account ).toHaveProperty( 'wpcom/get-site' );
		expect( result.current.mcpAbilities.account ).toHaveProperty( 'wpcom/get-account' );
		expect( result.current.mcpAbilities.site ).toHaveProperty( 'wpcom/get-site' );
		expect( result.current.mcpAbilities.site ).not.toHaveProperty( 'wpcom/get-account' );
		expect( result.current.mcpAbilities.sites[ 0 ] ).toEqual( {
			blog_id: 123,
			site_level_enabled: true,
			abilities: { 'wpcom/get-site': false },
			remote_groups: {},
			group_intents: { read: true },
		} );
	} );

	test( 'sends Hub updates in the native endpoint shape', async () => {
		apiFetch.mockResolvedValueOnce( wpcomResponse ).mockResolvedValueOnce( wpcomResponse );
		const { result } = renderHook( () => useMcpSettings() );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		await act( async () => {
			await result.current.updateMcpAbilities( {
				sites: [
					{
						blog_id: 123,
						site_level_enabled: true,
						abilities: { 'wpcom/get-site': false },
					},
				],
			} );
		} );

		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/wpcom/v2/sites/123/mcp-abilities',
			method: 'POST',
			data: {
				site_level_enabled: true,
				abilities: { 'wpcom/get-site': false },
			},
		} );
	} );

	test( 'maps a missing plan to the Hub access-denied state', async () => {
		apiFetch.mockResolvedValueOnce( { has_mcp_plan: false } );

		const { result } = renderHook( () => useMcpSettings() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.hasMcpAccess ).toBe( false );
		expect( result.current.mcpAbilities ).toEqual( {} );
	} );

	test.each( [
		{ siteEnabled: true, backendEnabled: false, overrides: {}, expected: false },
		{ siteEnabled: true, backendEnabled: true, overrides: {}, expected: true },
		{ siteEnabled: true, backendEnabled: false, overrides: { opt_in: true }, expected: true },
		{ siteEnabled: true, backendEnabled: true, overrides: { opt_in: false }, expected: false },
	] )(
		'uses the API state for opt-in tools unless explicitly overridden: %j',
		( { siteEnabled, backendEnabled, overrides, expected } ) => {
			const { mcp_abilities: settings } = normalizeWpcomMcpSettings(
				{
					has_mcp_plan: true,
					site_level_enabled: siteEnabled,
					abilities: [
						{ name: 'opt_in', enabled: backendEnabled, requires_opt_in: true },
						{ name: 'ordinary_read', readonly: true, enabled: ! siteEnabled },
						{ name: 'ordinary_write', readonly: false, enabled: false },
					],
					user_overrides: { abilities: overrides },
				},
				123
			);

			expect(
				mergeSiteMcpAbilities(
					settings.account,
					settings.sites[ 0 ].abilities,
					settings.sites[ 0 ].site_level_enabled
				)
			).toEqual( {
				opt_in: { name: 'opt_in', enabled: expected, requires_opt_in: true },
				ordinary_read: { name: 'ordinary_read', readonly: true, enabled: siteEnabled },
				ordinary_write: { name: 'ordinary_write', readonly: false, enabled: false },
			} );
		}
	);
} );

describe( 'useMcpSettings with skip', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	test( 'skip: exposes empty state and never fetches', () => {
		const { result } = renderHook( () => useMcpSettings( { skip: true } ) );

		expect( result.current.isLoading ).toBe( false );
		expect( apiFetch ).not.toHaveBeenCalled();
		expect( result.current.mcpAbilities ).toBeNull();
		expect( result.current.hasMcpAccess ).toBeNull();
		expect( result.current.error ).toBeNull();
		expect( result.current.savingToolIds.size ).toBe( 0 );
	} );

	test( 'un-skipping starts the fetch', async () => {
		apiFetch.mockResolvedValueOnce( {
			has_mcp_access: true,
			mcp_abilities: { account: { some_tool: {} }, sites: [] },
		} );

		const { result, rerender } = renderHook( ( { skip } ) => useMcpSettings( { skip } ), {
			initialProps: { skip: true },
		} );
		expect( apiFetch ).not.toHaveBeenCalled();

		rerender( { skip: false } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current.hasMcpAccess ).toBe( true );
	} );
} );
