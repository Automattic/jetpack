import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { wpcomTrackEvent } from '../../../common/tracks';

export interface Cta {
	label: string;
	url: string;
	// Present only on the reverted state's CTA, which opens the Help Center with
	// this typed in rather than following its href.
	message?: string;
}

export type TrackProps = Record< string, string | number >;

/**
 * Record a notice dismissal for the current user; the server stamps its own time.
 *
 * @param metaKey   - The notice's dismissal meta key.
 * @param keepalive - Let the write survive a page unload the caller is starting.
 * @return The pending write.
 */
export const recordDismissal = ( metaKey: string, keepalive = false ): Promise< unknown > =>
	apiFetch( {
		path: '/wp/v2/users/me',
		method: 'POST',
		data: { meta: { [ metaKey ]: 1 } },
		keepalive,
	} );

/**
 * Record an event once per browser session.
 *
 * @param key       - Session flag the event is counted under.
 * @param eventName - Tracks event name.
 * @param props     - Event properties.
 */
export const trackOncePerSession = ( key: string, eventName: string, props: TrackProps ): void => {
	// Storage can throw in private browsing or sandboxed frames; the event then fires again.
	try {
		if ( sessionStorage.getItem( key ) === '1' ) {
			return;
		}
		sessionStorage.setItem( key, '1' );
	} catch {
		// Storage unavailable.
	}
	wpcomTrackEvent( eventName, props );
};

const openHelpCenterWithMessage = ( message: string ): boolean => {
	// Registered late and not on every screen, so neither the store nor its
	// actions can be assumed.
	const helpCenter = dispatch( 'automattic/help-center' ) as
		| {
				setShowHelpCenter?: ( show: boolean ) => void;
				setNavigateToRoute?: ( route: string ) => void;
		  }
		| undefined;
	if (
		typeof helpCenter?.setShowHelpCenter !== 'function' ||
		typeof helpCenter?.setNavigateToRoute !== 'function'
	) {
		return false;
	}
	helpCenter.setShowHelpCenter( true );
	helpCenter.setNavigateToRoute( `/odie?query=${ encodeURIComponent( message ) }` );
	return true;
};

/**
 * Follow a CTA and record the click. The support CTA opens the Help Center in
 * place; its href is only the fallback for a Help Center that never loaded.
 *
 * @param event      - The click.
 * @param message    - Support message to open the Help Center with, if this is the support CTA.
 * @param ctaId      - Which CTA, for the event.
 * @param eventName  - Tracks event name.
 * @param trackProps - Event properties.
 * @return Whether the Help Center opened here instead of the page navigating.
 */
export const clickCta = (
	event: Pick< Event, 'preventDefault' >,
	message: string | undefined,
	ctaId: string,
	eventName: string,
	trackProps: TrackProps
): boolean => {
	const openedHere = message ? openHelpCenterWithMessage( message ) : false;
	if ( openedHere ) {
		event.preventDefault();
	}
	wpcomTrackEvent( eventName, { ...trackProps, cta: message ? 'support' : ctaId } );
	return openedHere;
};

/**
 * Record a dismissal, putting the notice back if the write fails so a failure
 * reads as one rather than as a notice that returns on the next load.
 *
 * @param metaKey    - The notice's dismissal meta key.
 * @param eventName  - Tracks event name; `_failed` is appended on error.
 * @param trackProps - Event properties.
 * @param restore    - Shows the notice again.
 */
export const dismissNotice = async (
	metaKey: string,
	eventName: string,
	trackProps: TrackProps,
	restore: () => void
): Promise< void > => {
	try {
		await recordDismissal( metaKey );
		wpcomTrackEvent( eventName, trackProps );
	} catch ( err ) {
		restore();
		wpcomTrackEvent( `${ eventName }_failed`, {
			...trackProps,
			error_message: err instanceof Error ? err.message : String( err ),
		} );
		// eslint-disable-next-line no-console
		console.error( 'Failed to record expiry notice dismiss', err );
	}
};
