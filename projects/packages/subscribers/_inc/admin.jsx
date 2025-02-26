/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './style.module.scss';

const JetpackSubscribers = () => {
	return <Text>{ __( 'Hello world!', 'jetpack-subscribers' ) }</Text>;
};

/**
 * The initial renderer function.
 */
async function render() {
	const container = document.getElementById( 'jetpack-subscribers' );
	if ( null === container ) {
		return;
	}
	createRoot( container ).render( <JetpackSubscribers /> );
}

render();
