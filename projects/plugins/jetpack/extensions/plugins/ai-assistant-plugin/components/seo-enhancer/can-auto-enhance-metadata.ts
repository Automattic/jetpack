/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
/**
 * Internal dependencies
 */
import { isAiSeoEnabled } from './is-ai-seo-enabled';

/**
 * Whether the site's saved auto-generate setting is on, as sent with the editor's initial state.
 *
 * @return {boolean} Whether the setting is on.
 */
export function isAutoEnhanceSettingOn(): boolean {
	return getJetpackData()?.[ 'ai-assistant' ]?.[ 'is-seo-auto-enhance-enabled' ] === true;
}

/**
 * Whether automatic metadata generation may run on this site: only while the
 * AI SEO feature is effectively on, and on Simple only once Jetpack › SEO has
 * switched it on, since the editor cannot switch it there.
 *
 * @return {boolean} Whether the automatic paths may run.
 */
export function canAutoEnhanceMetadata(): boolean {
	return isAiSeoEnabled() && ( ! isSimpleSite() || isAutoEnhanceSettingOn() );
}
