/**
 * Content Guidelines AI — Entry point.
 *
 * Injects Jetpack AI-powered generate/improve buttons into the
 * Content Guidelines admin page (Gutenberg experimental feature).
 */
import '@automattic/jetpack-shared-extension-utils/store/wordpress-com';
import './content-guidelines-ai/store';
import './content-guidelines-ai/style.scss';
import { startInjection } from './content-guidelines-ai/lib/inject';

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', startInjection );
} else {
	startInjection();
}
