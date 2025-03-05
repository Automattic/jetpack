import { select, dispatch, subscribe } from '@wordpress/data';

const unsubscribeShowWelcomeGuide = subscribe( () => {
	// On mounting, the welcomeGuide feature is turned on by default. This opens the welcome guide despite `welcomeGuideStatus` value.
	// This check ensures that we only listen to `welcomeGuide` changes if the welcomeGuideStatus value is loaded and respected
	if ( select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideStatusLoaded() ) {
		dispatch( 'automattic/wpcom-welcome-guide' ).setShowWelcomeGuide( true, {
			openedManually: true,
		} );

		unsubscribeShowWelcomeGuide();
	}
} );
