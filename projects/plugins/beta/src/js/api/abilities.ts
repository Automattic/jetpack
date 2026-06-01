/**
 * Typed client for Jetpack Beta WP Abilities API endpoints.
 *
 * The WP Abilities API run controller (`wp-abilities/v1/abilities/<id>/run`)
 * dispatches by HTTP method based on the ability's annotations: read-only
 * abilities MUST be called with GET, updates with POST. In both cases the
 * ability input is wrapped in an `input` envelope (query param for GET, JSON
 * body for POST). The response is the bare ability output.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { PluginListItem, PluginUpdate, PluginView, Settings } from './types';

const path = ( ability: string ) => `/wp-abilities/v1/abilities/${ ability }/run`;

/**
 * Extract a human-readable message from an unknown thrown value, falling back to
 * a provided default. Used to surface ability/apiFetch failures in the UI.
 *
 * @param error    - The caught value.
 * @param fallback - Message to use when none can be derived.
 * @return The error message, or the fallback.
 */
export const errorMessage = ( error: unknown, fallback: string ): string =>
	error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
		? error.message
		: fallback;

/**
 * Call a read-only ability via GET. Any input is passed in the `input` query
 * envelope; zero-argument abilities are called with a bare GET.
 *
 * @param {string} ability - Ability id.
 * @param {object} input   - Optional input arguments.
 * @return {Promise} The ability output.
 */
const read = < T >( ability: string, input?: Record< string, unknown > ): Promise< T > =>
	apiFetch< T >( {
		path: input ? addQueryArgs( path( ability ), { input } ) : path( ability ),
		method: 'GET',
	} );

/**
 * Call an updating ability via POST. Input is wrapped in the `input` envelope.
 *
 * @param {string} ability - Ability id.
 * @param {object} input   - Input arguments.
 * @return {Promise} The ability output.
 */
const write = < T >( ability: string, input: Record< string, unknown > ): Promise< T > =>
	apiFetch< T >( { path: path( ability ), method: 'POST', data: { input } } );

export const listPlugins = () =>
	read< { plugins: PluginListItem[] } >( 'jetpack-beta/list-plugins' );
export const getPlugin = ( slug: string ) =>
	read< PluginView >( 'jetpack-beta/get-plugin', { slug } );
export const getSettings = () => read< Settings >( 'jetpack-beta/get-settings' );
export const activateBranch = ( slug: string, source: string, id: string ) =>
	write< { success: boolean; plugin: PluginView } >( 'jetpack-beta/activate-branch', {
		slug,
		source,
		id,
	} );
export const updateSettings = ( patch: Partial< Settings > ) =>
	write< Settings >( 'jetpack-beta/update-settings', patch as Record< string, unknown > );
export const listUpdates = ( slug?: string ) =>
	read< { updates: PluginUpdate[] } >( 'jetpack-beta/list-updates', slug ? { slug } : undefined );
export const updatePlugin = ( pluginFile: string ) =>
	write< { success: boolean; updates: PluginUpdate[] } >( 'jetpack-beta/update-plugin', {
		plugin_file: pluginFile,
	} );
