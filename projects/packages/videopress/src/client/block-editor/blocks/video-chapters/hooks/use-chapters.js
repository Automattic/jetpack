/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

const getIFrameWindowElement = id => {
	const videoSandboxEl = document.getElementById( id );
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

	return iFrameWindow;
};

export default ( { guid, linkClientId } ) => {
	const [ chapters, setChapters ] = useState( [] );
	const [ currentChapter, setCurrentChapter ] = useState( [] );
	useEffect( () => {
		if ( ! linkClientId ) {
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

		window.addEventListener( 'onChaptersChapterChange', event => {
			const { detail } = event;
			const { currentChapter: currentChapterEvent } = detail;
			setCurrentChapter( currentChapterEvent );
		} );

		return function () {
			window.removeEventListener( 'onChaptersTrackChange' );
			window.removeEventListener( 'onChaptersChapterChange' );
		};
	}, [ linkClientId, guid ] );

	const iFrameWindowElement = getIFrameWindowElement( linkClientId );

	const seek = useCallback(
		time => {
			if ( ! iFrameWindowElement ) {
				return;
			}

			iFrameWindowElement.postMessage(
				{
					event: 'seek',
					time: Number( time ) * 1000,
				},
				'*'
			);
		},
		[ linkClientId, iFrameWindowElement ]
	);

	const play = useCallback( () => {
		if ( ! iFrameWindowElement ) {
			return;
		}

		iFrameWindowElement.postMessage(
			{
				event: 'play',
			},
			'*'
		);
	}, [ linkClientId, iFrameWindowElement ] );

	const pause = useCallback( () => {
		if ( ! iFrameWindowElement ) {
			return;
		}

		iFrameWindowElement.postMessage(
			{
				event: 'play',
			},
			'*'
		);
	}, [ linkClientId, iFrameWindowElement ] );

	return { chapters, currentChapter, seek, play, pause };
};
