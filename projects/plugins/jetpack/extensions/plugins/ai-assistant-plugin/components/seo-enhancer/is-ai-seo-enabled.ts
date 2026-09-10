/**
 * External dependencies
 */
import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Whether the AI SEO feature — metadata generation, manual and automatic —
 * may run: the feature's effective state, computed server-side with the host
 * and master gates folded in. A missing state reads as on (pre-feature payload).
 *
 * @return {boolean} Whether the AI SEO feature is on.
 */
export function isAiSeoEnabled(): boolean {
	return getJetpackData()?.[ 'ai-assistant' ]?.[ 'is-seo-enabled' ] !== false;
}
