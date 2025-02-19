/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';

import './style.module.scss';

const JetpackSubscribers = () => {
	return <p>ok</p>;
};

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'jetpack-subscribers' );
	if ( null === container ) {
		return;
	}

	createRoot( container ).render( <JetpackSubscribers /> );
}

render();
