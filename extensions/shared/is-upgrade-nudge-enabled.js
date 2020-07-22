/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Return whether upgrade nudges are enabled or not
 *
 * @returns {boolean}
 */
export default function isUpgradeNudgeEnabled() {
	return get( getJetpackData(), 'jetpack.enable_upgrade_nudge', false );
}
