/**
 * External dependencies
 */
import { get } from 'lodash';
import getJetpackData from './get-jetpack-data';

/**
 * Return whether upgrade nudges are enabled or not.
 *
 * @returns {boolean} True if the Upgrade Nudge is enable. Otherwise, False.
 */
export function isUpgradeNudgeEnabled() {
	return get( getJetpackData(), 'jetpack.enable_upgrade_nudge', false );
}
