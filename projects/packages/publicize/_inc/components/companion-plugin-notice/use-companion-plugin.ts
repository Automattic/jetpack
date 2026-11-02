import apiFetch from '@wordpress/api-fetch';
import { useCallback, useSyncExternalStore } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { getSocialScriptData } from '../../utils/script-data';
import type { CompanionPlugin } from '../../types';

export type CompanionPluginState =
	{ status: 'idle' | 'busy' | 'active' | 'dismissed' } | { status: 'error'; message: string };

const IDLE: CompanionPluginState = { status: 'idle' };

// Module-level so that every notice for the same plugin on the page moves together.
const states = new Map< string, CompanionPluginState >();
const listeners = new Set< () => void >();
const viewed = new Set< string >();

const setState = ( slug: string, state: CompanionPluginState ) => {
	states.set( slug, state );
	listeners.forEach( listener => listener() );
	return state;
};

// Some core plugin errors, like the PHP version check, are HTML.
const toPlainText = ( message: string ) =>
	decodeEntities( message.replace( /<[^>]*>/g, ' ' ) )
		.replace( /\s+/g, ' ' )
		.trim();

const subscribe = ( listener: () => void ) => {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
};

/**
 * Reset every plugin to its initial state. For tests.
 */
export function resetCompanionPluginStates() {
	states.clear();
	viewed.clear();
}

/**
 * Record that a notice was seen, so a panel reopened on the same page is not counted twice.
 *
 * @param key - The plugin slug and where the notice showed.
 * @return Whether this is the first view on the page.
 */
export function markViewed( key: string ): boolean {
	if ( viewed.has( key ) ) {
		return false;
	}
	viewed.add( key );
	return true;
}

/**
 * Get the plugin offered alongside a social network, if the current user should be offered one.
 *
 * @param serviceName - The connection's service, e.g. `bluesky`.
 * @return The plugin, or undefined.
 */
export function getCompanionPlugin( serviceName: string ): CompanionPlugin | undefined {
	return getSocialScriptData()?.companion_plugins?.find(
		( { service } ) => service === serviceName
	);
}

/**
 * The request that turns a plugin on.
 *
 * @param plugin - The plugin.
 * @return The `apiFetch` options.
 */
function getActivationRequest( plugin: CompanionPlugin ) {
	switch ( plugin.action ) {
		case 'activate':
			return {
				path: `/wp/v2/plugins/${ plugin.plugin }`,
				method: 'PUT',
				data: { status: 'active' },
			};
		case 'enable':
			return { path: '/wpcom/v2/activitypub/status', method: 'PUT', data: { enabled: true } };
		default:
			return {
				path: '/wp/v2/plugins',
				method: 'POST',
				data: { slug: plugin.slug, status: 'active' },
			};
	}
}

/**
 * Install or activate, and dismiss, the plugin offered alongside a social network.
 *
 * `install()` resolves to the plugin's new state, or null when there is nothing to install from here.
 *
 * @param serviceName - The connection's service, e.g. `bluesky`.
 * @return The plugin, its state, and the actions.
 */
export function useCompanionPlugin( serviceName: string ) {
	const plugin = getCompanionPlugin( serviceName );
	const slug = plugin?.slug;

	const state = useSyncExternalStore( subscribe, () => ( slug && states.get( slug ) ) || IDLE );

	const install = useCallback( async (): Promise< CompanionPluginState | null > => {
		// `marketplace` is a link to WordPress.com, which does the install itself.
		if ( ! plugin || plugin.action === 'marketplace' ) {
			return null;
		}

		setState( plugin.slug, { status: 'busy' } );

		try {
			await apiFetch( getActivationRequest( plugin ) );

			return setState( plugin.slug, { status: 'active' } );
		} catch ( error ) {
			return setState( plugin.slug, {
				status: 'error',
				message: toPlainText( ( error as { message?: string } )?.message ?? '' ),
			} );
		}
	}, [ plugin ] );

	const dismiss = useCallback( () => {
		if ( ! plugin ) {
			return;
		}

		setState( plugin.slug, { status: 'dismissed' } );

		// The notice stays hidden for this page view even if saving the dismissal fails.
		apiFetch( {
			path: `/wpcom/v2/publicize/companion-plugins/${ plugin.slug }/dismiss`,
			method: 'POST',
		} ).catch( () => {} );
	}, [ plugin ] );

	return { plugin, state, install, dismiss };
}
