/**
 * Custom hook for fetching and updating MCP settings via the wpcom/v2/jetpack-ai/mcp-settings endpoint.
 *
 * The PHP proxy at wpcom/v2/jetpack-ai/mcp-settings forwards requests to
 * the WPCOM /me/settings API which handles partial mcp_abilities merges server-side.
 * Updates only need to send the changed portion (e.g. { sites: [...] }).
 */

import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const DEFAULT_API = {
	path: '/wpcom/v2/jetpack-ai/mcp-settings',
	format: 'jetpack',
};

/**
 * Convert the native WordPress.com MCP response to the Hub's settings shape.
 *
 * @param {object} data   - Native endpoint response.
 * @param {number} blogId - Current site ID.
 * @return {object} AI Hub MCP settings response.
 */
export function normalizeWpcomMcpSettings( data, blogId ) {
	if ( ! data?.has_mcp_plan ) {
		return { has_mcp_access: false, mcp_abilities: {} };
	}

	const account = {};
	const site = {};
	for ( const ability of data?.abilities ?? [] ) {
		if ( ! ability?.name ) {
			continue;
		}

		account[ ability.name ] = ability;
		if ( ability.site_context ) {
			site[ ability.name ] = ability;
		}
	}

	const siteLevelEnabled = data?.site_level_enabled === true;
	const userOverrides = data?.user_overrides ?? {};

	return {
		has_mcp_access: true,
		mcp_abilities: {
			account,
			site,
			sites: [
				{
					blog_id: Number( blogId ),
					site_level_enabled: siteLevelEnabled,
					abilities: userOverrides.abilities ?? {},
					group_intents: userOverrides.group_intents ?? {},
				},
			],
			site_level_enabled_default: siteLevelEnabled,
			groups: data?.groups ?? [],
		},
	};
}

/**
 * Convert a partial Hub update to the native WordPress.com endpoint shape.
 *
 * @param {object} update - Partial Hub MCP settings update.
 * @return {object} Native WordPress.com update body.
 */
export function prepareWpcomMcpUpdate( update ) {
	const site = update?.sites?.[ 0 ] ?? {};
	const data = {};

	for ( const key of [ 'site_level_enabled', 'abilities', 'group_intents' ] ) {
		if ( Object.hasOwn( site, key ) ) {
			data[ key ] = site[ key ];
		}
	}

	return data;
}

/**
 * Hook that loads and exposes MCP settings for the current site.
 *
 * @param {object}  [options]      - Hook options.
 * @param {boolean} [options.skip] - Skip the fetch and expose empty state (for callers
 *                                 that know the request cannot succeed).
 * @return {{ isLoading: boolean, savingToolIds: Set, mcpAbilities: Object|null, hasMcpAccess: boolean|null, error: string|null, updateMcpAbilities: Function }} MCP settings state and updater.
 */
export function useMcpSettings( { skip = false } = {} ) {
	const { blogId = 0, mcpSettingsApi = DEFAULT_API } = window?.jetpackAiSettings ?? {};
	const endpoint = mcpSettingsApi.path ?? DEFAULT_API.path;
	const usesWpcomApi = mcpSettingsApi.format === 'wpcom';
	const [ isLoading, setIsLoading ] = useState( ! skip );
	const [ savingToolIds, setSavingToolIds ] = useState( () => new Set() );
	const [ mcpAbilities, setMcpAbilities ] = useState( null );
	const [ hasMcpAccess, setHasMcpAccess ] = useState( null );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		if ( skip ) {
			// Clear state so nothing from an earlier fetch lingers.
			setIsLoading( false );
			setSavingToolIds( new Set() );
			setMcpAbilities( null );
			setHasMcpAccess( null );
			setError( null );
			return;
		}
		let cancelled = false;
		setIsLoading( true );
		apiFetch( { path: endpoint } )
			.then( data => {
				if ( ! cancelled ) {
					const response = usesWpcomApi ? normalizeWpcomMcpSettings( data, blogId ) : data;
					setMcpAbilities( response?.mcp_abilities ?? {} );
					// has_mcp_access is explicitly set by the PHP proxy.
					// Fall back to checking whether any account tools were returned.
					setHasMcpAccess(
						response?.has_mcp_access !== false &&
							Object.keys( response?.mcp_abilities?.account ?? {} ).length > 0
					);
					setError( null );
				}
			} )
			.catch( err => {
				if ( ! cancelled ) {
					setError( err?.message ?? __( 'Failed to load MCP settings.', 'jetpack' ) );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ blogId, endpoint, usesWpcomApi, skip ] );

	/**
	 * Send a partial mcp_abilities update.
	 * The WPCOM /me/settings API merges the update into existing abilities server-side.
	 *
	 * @param {object} update - Partial mcp_abilities payload, e.g. { sites: [...] }
	 * @return {Promise} Resolves when the update is saved.
	 */
	const updateMcpAbilities = useCallback(
		update => {
			// Collect the toolIds this request touches so only those toggles are disabled.
			const siteEntry = update.sites?.[ 0 ] ?? {};
			const toolIds = Object.keys( siteEntry.abilities ?? {} );
			// Use a sentinel for site_level_enabled so the main toggle is also targeted.
			if ( siteEntry.site_level_enabled !== undefined ) {
				toolIds.push( '__site_level__' );
			}

			setSavingToolIds( prev => {
				const next = new Set( prev );
				toolIds.forEach( id => next.add( id ) );
				return next;
			} );

			return apiFetch( {
				path: endpoint,
				method: 'POST',
				data: usesWpcomApi ? prepareWpcomMcpUpdate( update ) : { mcp_abilities: update },
			} )
				.then( data => {
					const response = usesWpcomApi ? normalizeWpcomMcpSettings( data, blogId ) : data;
					setMcpAbilities( response?.mcp_abilities ?? mcpAbilities );
					setError( null );
				} )
				.catch( err => {
					setError( err?.message ?? __( 'Failed to save MCP settings.', 'jetpack' ) );
					throw err;
				} )
				.finally( () => {
					setSavingToolIds( prev => {
						const next = new Set( prev );
						toolIds.forEach( id => next.delete( id ) );
						return next;
					} );
				} );
		},
		[ blogId, endpoint, mcpAbilities, usesWpcomApi ]
	);

	return { isLoading, savingToolIds, mcpAbilities, hasMcpAccess, error, updateMcpAbilities };
}
