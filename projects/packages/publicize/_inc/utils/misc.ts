import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { __, sprintf } from '@wordpress/i18n';
import { Connection } from '../social-store/types';

/**
 * Check if the social module can be toggled.
 *
 * @return Whether the social module can be toggled.
 */
export function canToggleSocialModule() {
	const is_wpcom = getScriptData().site.host === 'wpcom';

	return ! is_wpcom && currentUserCan( 'manage_modules' );
}

/**
 * Get the accessibility label for a connection toggle.
 * @param {Connection} connection - The social media connection.
 *
 * @return The accessibility label.
 */
export function getA11yLabelForConnectionToggle( connection: Connection ) {
	return sprintf(
		/* translators: 1: Social account name, 2: Social network name like "Tumblr" */
		__( 'Toggle connection: %1$s on %2$s', 'jetpack-publicize-pkg' ),
		connection.display_name,
		connection.service_label
	);
}
