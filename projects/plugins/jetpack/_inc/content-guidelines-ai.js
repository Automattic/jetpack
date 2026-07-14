/**
 * Content Guidelines AI — Entry point.
 *
 * Injects Jetpack AI-powered generate/improve buttons into the
 * Content Guidelines admin page (Gutenberg experimental feature).
 */
import '@automattic/jetpack-shared-extension-utils/store/wordpress-com';
import { select } from '@wordpress/data';
import './content-guidelines-ai/store';
import './content-guidelines-ai/style.scss';
import { startInjection } from './content-guidelines-ai/lib/inject';

// Warm the AI feature check now so it runs in parallel with the page's own
// data loading. The resolver fires on the first select and its resolution is
// cached, so components mounting later (only after Gutenberg renders the
// guidelines list) attach to this request instead of starting it then.
select( 'wordpress-com/plans' ).getAiAssistantFeature();

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', startInjection );
} else {
	startInjection();
}
