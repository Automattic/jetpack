import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';

/**
 * Check if the social module can be toggled.
 *
 * @return Whether the social module can be toggled.
 */
export function canToggleSocialModule() {
	const is_wpcom = getScriptData().site.host === 'wpcom';

	return ! is_wpcom && currentUserCan( 'manage_modules' );
}
