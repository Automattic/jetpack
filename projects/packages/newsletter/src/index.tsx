/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Newsletter Settings App
 *
 * @return {Element} The newsletter settings component.
 */
function NewsletterSettingsApp() {
	return (
		<div className="newsletter-settings">
			<h1>Newsletter Settings</h1>
			<p>This is a proof of concept, I am rendered via React.</p>
		</div>
	);
}

// Initialize the app when DOM is ready
const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
