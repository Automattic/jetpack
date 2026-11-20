/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { getCurrentRoutePath, onLocationChange } from '@jetpack-premium-analytics/routing';

// Every page of the dashboard subscribes to this channel, and to it followed by its own section.
const CHANNEL = 'premium-analytics';

// The section of the route `/`, which has no segment to take a name from.
const MAIN_SECTION = 'main';

/**
 * The channels of the page on screen: the channel of the dashboard, alone and with the section.
 *
 * The section is the first segment of the path of the route.
 *
 * @return The channels, none while another page is on screen.
 */
function getChannels(): string[] {
	const path = getCurrentRoutePath();

	if ( path === null ) {
		return [];
	}

	const [ section = MAIN_SECTION ] = path.split( '/' ).filter( Boolean );

	return [ CHANNEL, `${ CHANNEL }/${ section }` ];
}

/**
 * Show the What's new surface with the announcements of the page on screen, while its feature
 * flag is on.
 *
 * Imported on demand and never awaited, so the surface stays out of the dashboard's first
 * render. A load that fails leaves the dashboard without it.
 */
export function showWhatsNew(): void {
	if ( ! getScriptData()?.premium_analytics?.whats_new_enabled ) {
		return;
	}

	import( '@automattic/jetpack-announcements' )
		.then( ( { mountWhatsNew } ) => {
			let subscribed = '';
			let unmount = (): void => undefined;

			const subscribe = () => {
				const channels = getChannels();

				// The location also changes within a page, and several routes share a section.
				if ( channels.join() === subscribed ) {
					return;
				}

				subscribed = channels.join();

				if ( channels.length ) {
					unmount = mountWhatsNew( { channels } );
				} else {
					unmount();
				}
			};

			subscribe();
			onLocationChange( subscribe );
		} )
		.catch( () => undefined );
}
