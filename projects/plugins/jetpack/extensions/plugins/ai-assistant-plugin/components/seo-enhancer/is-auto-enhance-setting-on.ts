/**
 * External dependencies
 */
import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Whether the site's saved auto-generate setting is on, as sent with the editor's initial state.
 *
 * @return {boolean} Whether the setting is on.
 */
export function isAutoEnhanceSettingOn(): boolean {
	return getJetpackData()?.[ 'ai-assistant' ]?.[ 'is-seo-auto-enhance-enabled' ] === true;
}

/**
 * Whether the site can save the auto-generate setting through WordPress settings, as sent with
 * the editor's initial state.
 *
 * @return {boolean} Whether the setting can be saved there.
 */
export function isAutoEnhanceSettingSwitchable(): boolean {
	return getJetpackData()?.[ 'ai-assistant' ]?.[ 'is-seo-auto-enhance-switchable' ] === true;
}
