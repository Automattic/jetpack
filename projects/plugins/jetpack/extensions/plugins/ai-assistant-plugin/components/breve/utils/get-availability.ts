/**
 * External dependencies
 */
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
/**
 * Types
 */
import type { FeatureControl, PlansSelect } from '../types';

function getAiAssistantFeature() {
	const { getAiAssistantFeature: getFeature } = select( 'wordpress-com/plans' ) as PlansSelect;

	return getFeature();
}

export function getBreveAvailability() {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { currentTier, featuresControl } = getAiAssistantFeature();

	// Disabled remotely.
	if ( featuresControl?.[ 'write-brief' ]?.enabled === false ) {
		return false;
	}

	// Free plan users have access to Breve while it's in beta.
	// const isFreePlan = currentTier?.value === 0;
	// TODO: Review this logic when Breve is out of beta.
	// if ( isFreePlan ) {
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

export function canWriteBriefBeEnabled() {
	const { featuresControl } = getAiAssistantFeature();

	return featuresControl?.[ 'write-brief' ]?.enabled !== false;
}

export function canWriteBriefFeatureBeEnabled( feature: string ) {
	const { featuresControl } = getAiAssistantFeature();

	return ( featuresControl?.[ 'write-brief' ]?.[ feature ] as FeatureControl )?.enabled !== false;
}

export default getBreveAvailability;
