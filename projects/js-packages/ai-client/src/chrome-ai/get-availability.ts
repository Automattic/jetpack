/**
 * External dependencies
 */
import { initializeExPlat, loadExperimentAssignment } from '@automattic/jetpack-explat';
import { select } from '@wordpress/data';
/**
 * Types
 */
type FeatureControl = {
	enabled: boolean;
};

type PlansSelect = {
	getAiAssistantFeature: () => {
		currentTier?: { value: number };
		featuresControl?: Record< string, FeatureControl >;
	};
};

/**
 * Get the AI Assistant feature.
 *
 * @return {object} The AI Assistant feature.
 */
function getAiAssistantFeature() {
	const { getAiAssistantFeature: getFeature } = select( 'wordpress-com/plans' ) as PlansSelect;
	return getFeature();
}

/**
 * Check if Chrome AI can be enabled.
 *
 * @return {boolean} Whether Chrome AI can be enabled.
 */
export async function isChromeAIAvailable() {
	const { featuresControl } = getAiAssistantFeature();

	// Extra check if we want to control this via the feature flag for now
	if ( featuresControl?.[ 'chrome-ai' ]?.enabled !== false ) {
		return false;
	}

	initializeExPlat();

	const { variationName } = await loadExperimentAssignment(
		'calypso_jetpack_ai_gemini_api_202503_v1'
	);

	if ( variationName === 'control' ) {
		return false;
	}

	return true;
}

export default isChromeAIAvailable;
