import analytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';

declare global {
	interface Window {
		/** Set by PHP when the site and user allow Tracks. */
		jetpackProtectTracks?: boolean;
	}
}

type Props = Record< string, string | number | boolean >;

const viewed = new Set< string >();

let identified = false;

/**
 * Identify the connected user before the first event; a mount effect in a parent runs too late.
 */
function identify() {
	if ( identified ) {
		return;
	}
	identified = true;
	const wpcomUser = getScriptData()?.user?.current_user?.wpcom;
	if ( wpcomUser?.ID && wpcomUser?.login ) {
		analytics.initialize( wpcomUser.ID, wpcomUser.login );
	}
}

/**
 * Add the site's WordPress.com blog ID, which the analytics client only takes from `jpTracksContext`.
 *
 * @param props - Event properties.
 * @return The properties to send.
 */
function withSite( props: Props ): Props {
	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	return blogId ? { blog_id: blogId, ...props } : props;
}

/**
 * Record an event, unless PHP disallowed Tracks: another plugin's w.js would still send it.
 *
 * @param event - Event name.
 * @param props - Event properties.
 */
export function recordEvent( event: string, props: Props = {} ) {
	if ( ! window.jetpackProtectTracks ) {
		return;
	}
	identify();
	analytics.tracks.recordEvent( event, withSite( props ) );
}

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
	recordEvent( event, props );
}
