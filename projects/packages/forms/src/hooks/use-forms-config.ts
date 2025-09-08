import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import type { FormsConfigData } from '../types';

// Minimal cache to prevent refetch across multiple instances on the same page
let cachedFormsConfig: FormsConfigData | undefined;

/**
 * Fetch the consolidated Forms config via REST.
 * @return {Promise<FormsConfigData>} Promise resolving to the consolidated forms configuration.
 */
export function fetchFormsConfig(): Promise< FormsConfigData > {
	return apiFetch< FormsConfigData >( { path: '/wp/v2/feedback/config' } );
}

/**
 * Fetch and return the consolidated Forms config.
 * Uses the preloaded REST response in editor context; falls back to network elsewhere.
 * @return {FormsConfigData|undefined} Consolidated forms configuration, or undefined while loading.
 */
export default function useFormsConfig(): FormsConfigData | undefined {
	const [ config, setConfig ] = useState< FormsConfigData | undefined >( undefined );

	useEffect( () => {
		if ( cachedFormsConfig ) {
			setConfig( cachedFormsConfig );
			return;
		}
		fetchFormsConfig()
			.then( data => {
				cachedFormsConfig = data;
				setConfig( data );
			} )
			.catch( () => {} );
	}, [] );

	return config;
}
