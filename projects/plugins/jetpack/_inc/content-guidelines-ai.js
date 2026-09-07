/**
 * Content Guidelines AI — Entry point.
 *
 * Injects Jetpack AI-powered generate/improve buttons into the
 * Content Guidelines admin page (Gutenberg experimental feature).
 */
import { mapAiFeatureResponseToAiFeatureProps } from '@automattic/jetpack-shared-stores';
import '@automattic/jetpack-shared-extension-utils/store/wordpress-com';
import { dispatch } from '@wordpress/data';
import './content-guidelines-ai/store';
import './content-guidelines-ai/style.scss';
import { startInjection } from './content-guidelines-ai/lib/inject';

// The AI feature state is resolved server-side and preloaded into the page
// (see _inc/content-guidelines-ai.php), so components render the correct
// locked/unlocked state on first paint with no client-side plan fetch.
// Without the preload (server-side lookup failed) render no AI UI at all —
// the store's optimistic hasFeature default would show unlocked buttons
// whose requests are destined to fail.
const aiFeature = window.jetpackContentGuidelinesAi?.aiFeature;

if ( aiFeature ) {
	const plansDispatch = dispatch( 'wordpress-com/plans' );
	plansDispatch.storeAiAssistantFeature( mapAiFeatureResponseToAiFeatureProps( aiFeature ) );
	// Mark the selector resolved so its resolver never fires a redundant
	// fetch when components select getAiAssistantFeature.
	plansDispatch.finishResolution( 'getAiAssistantFeature', [] );

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', startInjection );
	} else {
		startInjection();
	}
}
