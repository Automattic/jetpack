/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { isAiSeoEnabled } from './is-ai-seo-enabled';
import { isAutoEnhanceSettingSwitchable } from './is-auto-enhance-setting-on';

/**
 * Whether automatic metadata generation may run on this site: only while the
 * AI SEO feature is effectively on, and on Simple only where the setting can be saved.
 *
 * @return {boolean} Whether the automatic paths may run.
 */
export function canAutoEnhanceMetadata(): boolean {
	return isAiSeoEnabled() && ( ! isSimpleSite() || isAutoEnhanceSettingSwitchable() );
}
