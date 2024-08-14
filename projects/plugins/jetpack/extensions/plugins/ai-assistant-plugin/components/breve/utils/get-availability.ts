/**
 * External dependencies
 */
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability';

export function getBreveAvailability( _isFreePlan: boolean ) {
	// Free plan users have access to Breve while it's in beta.
	// TODO: Review this logic when Breve is out of beta.
	// if ( _isFreePlan ) {
	// 	return false;
	// }

	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will assume the block is not hidden if the function is undefined.

	// Not enabled if the AI Assistant block is hidden.
	if ( hiddenBlocks.includes( 'jetpack/ai-assistant' ) ) {
		return false;
	}

	// Not enabled if the feature flag is intentionally disabled.
	return getFeatureAvailability( 'ai-proofread-breve' );
}

export default getBreveAvailability;
