/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './style.module.scss';

const JetpackSubscribers = () => {
	return (
		<Text>
			{ __(
				'Hello world!',
				"no text domain is set in this in this project's eslint.config.mjs or composer.json"
			) }
		</Text>
	);
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
