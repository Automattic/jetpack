/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
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
export function isChromeAIAvailable() {
	const { featuresControl } = getAiAssistantFeature();
	return (
		featuresControl?.[ 'chrome-ai' ]?.enabled !== false &&
		getJetpackExtensionAvailability( 'ai-use-chrome-ai-sometimes' ).available !== false
	);
}

export default isChromeAIAvailable;
