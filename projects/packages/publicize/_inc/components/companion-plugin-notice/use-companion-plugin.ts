import apiFetch from '@wordpress/api-fetch';
import { useCallback, useSyncExternalStore } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { getSocialScriptData } from '../../utils/script-data';
import type { CompanionPluginAction, CompanionPluginSlug } from '../../types';

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

const SLUGS: Partial< Record< string, CompanionPluginSlug > > = {
	bluesky: 'atmosphere',
	mastodon: 'activitypub',
};

/**
 * The request that turns a plugin on.
 *
 * @param slug   - The plugin slug, also its directory and main file name.
 * @param action - How to turn it on.
 * @return The `apiFetch` options.
 */
function getActivationRequest( slug: CompanionPluginSlug, action: CompanionPluginAction ) {
	switch ( action ) {
		case 'activate':
			return {
				path: `/wp/v2/plugins/${ slug }/${ slug }`,
				method: 'PUT',
				data: { status: 'active' },
			};
		case 'enable':
			return { path: '/wpcom/v2/activitypub/status', method: 'PUT', data: { enabled: true } };
		default:
			return { path: '/wp/v2/plugins', method: 'POST', data: { slug, status: 'active' } };
	}
}

/**
 * Whether core reports a plugin as active.
 *
 * @param slug - The plugin slug.
 * @return Whether it is active.
 */
const isPluginActive = ( slug: CompanionPluginSlug ) =>
	apiFetch< { status: string } >( { path: `/wp/v2/plugins/${ slug }/${ slug }` } ).then(
		( { status } ) => status === 'active',
		() => false
	);

/**
 * Turn on, or dismiss, the plugin offered alongside a social network.
 *
 * `action` is undefined when the current user is not offered the plugin. `install()` resolves to
 * the plugin's new state, or null when there is nothing to install from here.
 *
 * @param serviceName - The connection's service, e.g. `bluesky`.
 * @return The plugin slug, how to turn it on, its state, and the actions.
 */
export function useCompanionPlugin( serviceName: string ) {
	const slug = SLUGS[ serviceName ];
	const action = slug ? getSocialScriptData()?.companion_plugins?.[ slug ] : undefined;

	const state = useSyncExternalStore( subscribe, () => ( slug && states.get( slug ) ) || IDLE );

	const install = useCallback( async (): Promise< CompanionPluginState | null > => {
		// `marketplace` is a link to WordPress.com, which does the install itself.
		if ( ! slug || ! action || action === 'marketplace' ) {
			return null;
		}

		setState( slug, { status: 'busy' } );

		try {
			await apiFetch( getActivationRequest( slug, action ) );

			return setState( slug, { status: 'active' } );
		} catch ( error ) {
			// ActivityPub redirects to its welcome screen once activated, so the response is not JSON.
			if ( action !== 'enable' && ( await isPluginActive( slug ) ) ) {
				return setState( slug, { status: 'active' } );
			}

			return setState( slug, {
				status: 'error',
				message: toPlainText( ( error as { message?: string } )?.message ?? '' ),
			} );
		}
	}, [ slug, action ] );

	const dismiss = useCallback( () => {
		if ( ! slug ) {
			return;
		}

		setState( slug, { status: 'dismissed' } );

		// The notice stays hidden for this page view even if saving the dismissal fails.
		apiFetch( {
			path: `/wpcom/v2/publicize/companion-plugins/${ slug }/dismiss`,
			method: 'POST',
		} ).catch( () => {} );
	}, [ slug ] );

	return { slug, action, state, install, dismiss };
}
