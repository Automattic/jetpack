import { createRoot } from '@wordpress/element';
import PricingGrid from './components/pricing-grid';

/**
 * Initialize the pricing grid React app.
 */
function init() {
	const container = document.getElementById( 'jp-stats-pricing-grid' );
	if ( ! container ) {
		return;
	}

	createRoot( container ).render( <PricingGrid /> );
}

// Mount when DOM is ready.
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
