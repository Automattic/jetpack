/**
 * Typed client for Jetpack Beta WP Abilities API endpoints.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';
import type { PluginListItem, PluginView, Settings } from './types';

const run = < T >( ability: string, data: Record< string, unknown > = {} ): Promise< T > =>
	apiFetch< T >( { path: `/wp-abilities/v1/abilities/${ ability }/run`, method: 'POST', data } );

export const listPlugins = () =>
	run< { plugins: PluginListItem[] } >( 'jetpack-beta/list-plugins' );
export const getPlugin = ( slug: string ) =>
	run< PluginView >( 'jetpack-beta/get-plugin', { slug } );
export const getSettings = () => run< Settings >( 'jetpack-beta/get-settings' );
export const activateBranch = ( slug: string, source: string, id: string ) =>
	run< { success: boolean; plugin: PluginView } >( 'jetpack-beta/activate-branch', {
		slug,
		source,
		id,
	} );
export const updateSettings = ( patch: Partial< Settings > ) =>
	run< Settings >( 'jetpack-beta/update-settings', patch as Record< string, unknown > );
