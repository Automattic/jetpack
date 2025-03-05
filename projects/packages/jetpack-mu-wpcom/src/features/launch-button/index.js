import { wpcomTrackEvent } from '../../common/tracks';

document.addEventListener( 'DOMContentLoaded', () => {
	const launchButton = document.querySelector( '#wpadminbar .launch-site' );
	if ( ! launchButton ) {
		return;
	}
	launchButton.addEventListener( 'click', () => {
		wpcomTrackEvent( 'wpcom_adminbar_launch_site' );
	} );
} );
