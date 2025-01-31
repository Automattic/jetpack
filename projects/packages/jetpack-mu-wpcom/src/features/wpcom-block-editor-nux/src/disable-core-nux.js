import { select, dispatch, subscribe } from '@wordpress/data';

import '@wordpress/nux'; //ensure nux store loads

// Disable nux features from core.
subscribe( () => {
	dispatch( 'core/nux' ).disableTips();
} );

// Note migration of areTipsEnabled: https://github.com/WordPress/gutenberg/blob/5c3a32dabe4393c45f7fe6ac5e4d78aebd5ee274/packages/data/src/plugins/persistence/index.js#L269
subscribe( () => {
	if ( select( 'core/nux' ).areTipsEnabled() ) {
		dispatch( 'core/nux' ).disableTips();
		dispatch( 'automattic/wpcom-welcome-guide' ).setShowWelcomeGuide( true );
	}
} );

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
