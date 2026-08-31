import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useMcpSettings } from '../use-mcp-settings';

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
} );
