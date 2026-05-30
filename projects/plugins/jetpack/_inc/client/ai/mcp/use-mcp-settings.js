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

const ENDPOINT = '/wpcom/v2/jetpack-ai/mcp-settings';

/**
 * Hook that loads and exposes MCP settings for the current site.
 *
 * @return {{ isLoading: boolean, isSaving: boolean, mcpAbilities: Object|null, error: string|null, updateMcpAbilities: Function }} MCP settings state and updater.
 */
export function useMcpSettings() {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ savingToolIds, setSavingToolIds ] = useState( () => new Set() );
	const [ mcpAbilities, setMcpAbilities ] = useState( null );
	const [ hasMcpAccess, setHasMcpAccess ] = useState( null );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		let cancelled = false;
		setIsLoading( true );
		apiFetch( { path: ENDPOINT } )
			.then( data => {
				if ( ! cancelled ) {
					setMcpAbilities( data?.mcp_abilities ?? {} );
					// has_mcp_access is explicitly set by the PHP proxy.
					// Fall back to checking whether any account tools were returned.
					setHasMcpAccess(
						data?.has_mcp_access !== false &&
							Object.keys( data?.mcp_abilities?.account ?? {} ).length > 0
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
	}, [] );

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
				path: ENDPOINT,
				method: 'POST',
				data: { mcp_abilities: update },
			} )
				.then( data => {
					setMcpAbilities( data?.mcp_abilities ?? mcpAbilities );
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
		[ mcpAbilities ]
	);

	return { isLoading, savingToolIds, mcpAbilities, hasMcpAccess, error, updateMcpAbilities };
}
