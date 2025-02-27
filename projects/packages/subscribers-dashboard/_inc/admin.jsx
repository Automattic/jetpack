/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './style.module.scss';

export const JetpackSubscribers = () => {
	return <b>{ __( 'Hello world!', 'jetpack-subscribers-dashboard' ) }</b>;
};

/**
 * The initial renderer function.
 */
async function render() {
	const container = document.getElementById( 'jetpack-subscribers-dashboard' );
	if ( null === container ) {
		return;
	}
	createRoot( container ).render( <JetpackSubscribers /> );
}

render();
