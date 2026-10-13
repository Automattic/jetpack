/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { isAiSeoEnabled } from './is-ai-seo-enabled';

/**
 * Whether automatic metadata generation may run on this site: never on Simple
 * sites, and only while the AI SEO feature is effectively on.
 *
 * @return {boolean} Whether the automatic paths may run.
 */
export function canAutoEnhanceMetadata(): boolean {
	return ! isSimpleSite() && isAiSeoEnabled();
}
