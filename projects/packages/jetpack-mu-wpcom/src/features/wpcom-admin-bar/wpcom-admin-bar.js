import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-admin-bar.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const launchButton = document.querySelector( '#wp-admin-bar-site-plan-badge a' );
	if ( ! launchButton ) {
		return;
	}
	launchButton.addEventListener( 'click', () => {
		wpcomTrackEvent( 'wpcom_adminbar_plan_clicked' );
	} );
} );
