import { dispatch } from '@wordpress/data';

const HELP_CENTER_STORE = 'automattic/help-center';

/**
 * Open the Help Center's chat with the message sent.
 *
 * Dispatched rather than linked because the route lives in the Help Center's own
 * router, so no URL reaches it.
 *
 * @param message - Text to send.
 * @return Whether the Help Center answered. False lets the caller fall through to its href.
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
