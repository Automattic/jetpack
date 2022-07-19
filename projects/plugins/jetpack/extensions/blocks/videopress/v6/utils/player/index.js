import dispatchPlayerAction from '../dispatcher';

export function setInitialTimeHelper( iFrame, currentTime, fn ) {
	if ( ! iFrame?.contentWindow ) {
		return;
	}

	function positionatePlayer() {
		dispatchPlayerAction( iFrame, 'vpBlockActionSetCurrentTime', {
			currentTime,
		} );

		dispatchPlayerAction( iFrame, 'vpBlockActionPause' );
		setTimeout( function () {
			// Clean on player listener.
			iFrame.contentWindow.removeEventListener( 'onVideoPressPlaying', positionatePlayer );
			fn();
		}, 0 );
	}

	iFrame.contentWindow.addEventListener( 'onVideoPressPlaying', positionatePlayer );

	/*
	 * Hack: Play video to be able to set the current time.
	 * We expect to stop it once the current time is set.
	 */
	dispatchPlayerAction( iFrame, 'vpBlockActionPlay' );
}
