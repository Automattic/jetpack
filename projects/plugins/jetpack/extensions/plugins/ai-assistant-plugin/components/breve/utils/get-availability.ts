/**
 * External dependencies
 */
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability';

export function getBreveAvailability( isFreePlan: boolean ) {
	// Breve is not available for free plans.
	if ( isFreePlan ) {
		return false;
	}

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
