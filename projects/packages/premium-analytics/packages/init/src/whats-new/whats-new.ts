/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

// Every page of the dashboard subscribes to this channel, and to it followed by its own section.
const CHANNEL = 'premium-analytics';

// The section of the route `/`, which has no segment to take a name from.
const MAIN_SECTION = 'main';

type NavigationEvents = {
	addEventListener: ( type: 'currententrychange', listener: () => void ) => void;
};

/**
 * The channels of the page on screen: the channel of the dashboard, alone and with the section.
 *
 * The section is the first segment of the route, which the router keeps in the `p` query argument.
 *
 * @return The channels.
 */
function getChannels(): string[] {
	const route = new URLSearchParams( window.location.search ).get( 'p' ) ?? '';
	const [ section = MAIN_SECTION ] = route.split( '/' ).filter( Boolean );

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

			const subscribe = () => {
				const channels = getChannels();

				// The URL also changes within a page, with its filters.
				if ( channels.join() !== subscribed ) {
					subscribed = channels.join();
					mountWhatsNew( { channels } );
				}
			};

			subscribe();

			// A browser without the Navigation API keeps the channels of the page it loaded on.
			( window as { navigation?: NavigationEvents } ).navigation?.addEventListener(
				'currententrychange',
				subscribe
			);
		} )
		.catch( () => undefined );
}
