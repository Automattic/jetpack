import { dispatch } from '@wordpress/data';
import { config } from '../constants';
import { AI_STORE_NAME } from '../store';

/**
 * Check if Jetpack AI is unavailable. If so, show the upgrade notice.
 *
 * @return {boolean} True if AI is unavailable.
 */
export function showUnavailableNotice() {
	if ( config.available ) {
		return false;
	}

	dispatch( AI_STORE_NAME ).showUpgradeNotice();
	return true;
}
