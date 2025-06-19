/**
 * External dependencies
 */
import { initializeExPlat, loadExperimentAssignment } from '@automattic/jetpack-explat';
import { select } from '@wordpress/data';
import debugFactory from 'debug';

const debug = debugFactory( 'ai-client:chrome-ai-availability' );

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
	if ( featuresControl?.[ 'chrome-ai' ]?.enabled !== true ) {
		debug( 'feature is disabled for this site/user' );
		return false;
	}

	initializeExPlat();
	debug( 'initialized explat' );

	const { variationName } = await loadExperimentAssignment(
		'calypso_jetpack_ai_gemini_api_202503_v1'
	);

	debug( 'variationName', variationName );

	return variationName === 'treatment';
}

export default isChromeAIAvailable;
