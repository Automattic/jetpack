import { select, dispatch, subscribe } from '@wordpress/data';

// Disable welcome guide features from core.
const unsubscribe = subscribe( () => {
	if ( select( 'core/edit-post' )?.isFeatureActive( 'welcomeGuide' ) ) {
		dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' );
		unsubscribe();
	}
	if ( select( 'core/edit-site' )?.isFeatureActive( 'welcomeGuide' ) ) {
		dispatch( 'core/edit-site' ).toggleFeature( 'welcomeGuide' );
		unsubscribe();
	}
} );

// Listen for these features being triggered to call dotcom welcome guide instead.
subscribe( () => {
	if ( select( 'core/edit-post' )?.isFeatureActive( 'welcomeGuide' ) ) {
		dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' );
		// On mounting, the welcomeGuide feature is turned on by default. This opens the welcome guide despite `welcomeGuideStatus` value.
		// This check ensures that we only listen to `welcomeGuide` changes if the welcomeGuideStatus value is loaded and respected
		if ( select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideStatusLoaded() ) {
			dispatch( 'automattic/wpcom-welcome-guide' ).setShowWelcomeGuide( true, {
				openedManually: true,
			} );
		}
	}
	if ( select( 'core/edit-site' )?.isFeatureActive( 'welcomeGuide' ) ) {
		dispatch( 'core/edit-site' ).toggleFeature( 'welcomeGuide' );
		if ( select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideStatusLoaded() ) {
			dispatch( 'automattic/wpcom-welcome-guide' ).setShowWelcomeGuide( true, {
				openedManually: true,
			} );
		}
	}
} );
