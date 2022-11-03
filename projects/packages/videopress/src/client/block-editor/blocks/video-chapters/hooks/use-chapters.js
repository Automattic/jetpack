/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export default ( { guid, linkClientId } ) => {
	const [ chapters, setChapters ] = useState( [] );
	useEffect( () => {
		if ( ! linkClientId ) {
			return;
		}

		const videoSandboxEl = document.getElementById( linkClientId );
		if ( ! videoSandboxEl ) {
			return;
		}

		const iFrame = videoSandboxEl.querySelector( 'iframe.components-sandbox' );
		if ( ! iFrame ) {
			return;
		}

		const iFrameWindow = iFrame.contentWindow;
		if ( ! iFrameWindow ) {
			return;
		}

		window.addEventListener( 'onChaptersTrackChange', event => {
			const { detail } = event;
			const { guid: eventGuid, chapters: eventChapters } = detail;
			if ( guid !== eventGuid ) {
				return;
			}

			setChapters( eventChapters );
		} );

		return function () {
			iFrameWindow.removeEventListener( 'onChaptersTrackChange' );
		};
	}, [ linkClientId, guid ] );

	return chapters;
};
