import analytics from '@automattic/jetpack-analytics';

type Props = Record< string, string | number >;

const viewed = new Set< string >();

/**
 * Record a view once per page load, so returning to a tab doesn't count it again.
 *
 * @param event - Event name.
 * @param props - Event properties; a view with other properties counts separately.
 */
export function recordViewOnce( event: string, props: Props = {} ) {
	const key = event + JSON.stringify( props );
	if ( viewed.has( key ) ) {
		return;
	}
	viewed.add( key );
	analytics.tracks.recordEvent( event, props );
}

/**
 * Record an event.
 *
 * @param event - Event name.
 * @param props - Event properties.
 */
export function recordEvent( event: string, props: Props = {} ) {
	analytics.tracks.recordEvent( event, props );
}
