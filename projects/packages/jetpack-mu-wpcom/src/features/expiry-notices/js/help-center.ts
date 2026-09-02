import { dispatch } from '@wordpress/data';

const HELP_CENTER_STORE = 'automattic/help-center';

/**
 * Open the Help Center's chat with the message already typed in.
 *
 * `?query=` fills the input without sending it, so the person still reads and
 * sends their own first message. Mirrors what Calypso's own inline Help Center
 * button does, since there is no URL that opens the panel in this state — the
 * route lives in the Help Center's own router, not the page's.
 *
 * @param message - Text to put in the chat input.
 * @return Whether the Help Center answered. False when its bundle is absent, so the caller can let the click fall through to its href instead.
 */
export const openHelpCenterWithMessage = ( message: string ): boolean => {
	let helpCenter;
	try {
		helpCenter = dispatch( HELP_CENTER_STORE );
	} catch {
		return false;
	}

	// Registered late and asynchronously, and not at all on a screen that never
	// loaded it, so neither the store nor either action can be assumed.
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
