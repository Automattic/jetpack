// import PopupMonitor from '@automattic/popup-monitor';

import { PopupMonitor } from './popup-monitor';

/**
 * The callback function of the requestExternalAccess utility.
 * @callback requestCallback
 * @param {import('../social-store/types').KeyringResult} result - Received authentication data.
 */

/**
 * Utility for requesting authorization of sharing services.
 * @param {string}          url - The URL to be loaded in the newly opened window.
 * @param {requestCallback} cb  - The callback that handles the response.
 */
export const requestExternalAccess = async ( url, cb ) => {
	const popupMonitor = new PopupMonitor( url );

	const data = await popupMonitor.start(
		url,
		null,
		'toolbar=0,location=0,status=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 780, 700 )
	);

	console.log( 'requestExternalAccess data', data );

	cb( data );
};
