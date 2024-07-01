import PopupMonitor from '@automattic/popup-monitor';

/**
 * The callback function of the requestExternalAccess utility.
 * @callback requestCallback
 * @param {import('../social-store/types').KeyringResult} result - Received authentication data.
 */

/**
 * Utility for requesting authorization of sharing services.
 * @param {string} url - The URL to be loaded in the newly opened window.
 * @param {requestCallback} cb - The callback that handles the response.
 */
export const requestExternalAccess = ( url, cb ) => {
	const popupMonitor = new PopupMonitor();
	let lastMessage;

	popupMonitor.open(
		url,
		null,
		'toolbar=0,location=0,status=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 780, 700 )
	);

	popupMonitor.once( 'close', () => {
		cb( lastMessage?.ID ? lastMessage : {} );
	} );

	popupMonitor.on( 'message', message => {
		lastMessage = message?.data;
	} );
};
