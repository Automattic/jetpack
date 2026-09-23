import { getAdminUrl } from '@automattic/jetpack-script-data';
import { _n, __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	holdActivationQueue,
	queueActivationRequest,
} from '../../../data/queue-activation-request';
import { onSwitchWritten } from '../../../data/switch-written';
import { fetchAdminMenu, linksTo, menuLinkOf, syncAdminMenu } from '../../../utils/admin-menu-sync';

export type MenuPointerTarget = {
	elements: HTMLElement[];
	label: string;
};

/**
 * Keep the wp-admin sidebar in step with the features switched on this tab.
 *
 * Each switch written on the server refreshes the sidebar in place, and the menu items it
 * added get pointed at.
 *
 * @param features - Every feature, to name a single new item.
 * @return The menu items to point at, if any, and a way to dismiss them.
 */
export function useSidebarSync( features: MainFeature[] ) {
	const [ pointer, setPointer ] = useState< MenuPointerTarget | null >( null );
	const latest = useRef( features );

	latest.current = features;

	useEffect( () => {
		const live = document.getElementById( 'adminmenu' );

		if ( ! live ) {
			return;
		}

		let controller: AbortController | undefined;

		const refresh = ( signal: AbortSignal, retries: number ) =>
			// Rendering any admin page runs `admin_init`, where plugins do deferred activation
			// work, so no switch may be written while it is out. A retry comes later, when a
			// switch may already be out, so it queues behind it instead.
			( retries > 0 ? holdActivationQueue : queueActivationRequest )( () =>
				// Tools is the cheapest admin page to render, and every page carries the same menu.
				fetchAdminMenu( getAdminUrl( 'tools.php' ), signal )
			)
				.then( fresh => {
					if ( ! fresh ) {
						throw new Error( 'The admin page had no menu.' );
					}

					const added = syncAdminMenu( live, fresh );

					// A refresh that only removes retires the pointer, which may mark an item
					// this one just took away.
					setPointer( added.length ? pickPointer( added, latest.current ) : null );
				} )
				.catch( () => {
					// Retried once: a switched-off feature's item would otherwise stay clickable
					// until the next page load.
					if ( retries > 0 && ! signal.aborted ) {
						refresh( signal, retries - 1 );
					}
				} );

		const unsubscribe = onSwitchWritten( () => {
			// A newer write supersedes the refresh in flight, which could otherwise land last.
			controller?.abort();
			controller = new AbortController();
			refresh( controller.signal, 1 );
		} );

		return () => {
			unsubscribe();
			controller?.abort();
		};
	}, [] );

	const dismissPointer = useCallback( () => setPointer( null ), [] );

	return { pointer, dismissPointer };
}

/**
 * Point at every new menu item, naming it when there is only one.
 *
 * @param added    - Menu items the refresh added, at least one.
 * @param features - Every feature.
 * @return The items and the tooltip's text.
 */
function pickPointer( added: HTMLElement[], features: MainFeature[] ): MenuPointerTarget {
	const [ first ] = added;
	const name =
		features.find( feature => linksTo( first, feature.manage_url ) )?.name ??
		menuLinkOf( first )?.textContent?.trim() ??
		'';

	return {
		elements: added,
		label:
			added.length > 1
				? sprintf(
						/* translators: %d is how many features were added to the wp-admin menu. */
						_n(
							'%d feature is now in your menu',
							'%d features are now in your menu',
							added.length,
							'jetpack-my-jetpack'
						),
						added.length
					)
				: sprintf(
						/* translators: %s is a feature name, e.g. "Stats". */
						__( '%s is now in your menu', 'jetpack-my-jetpack' ),
						name
					),
	};
}
