/**
 * External dependencies
 */
import { initializeExPlat, createExPlatClient } from '@automattic/jetpack-explat';
import { select } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import apiFetch from '../api-fetch/index.ts';

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

const debug = debugFactory( 'ai-client:chrome-ai-availability' );

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
 * Fetch an experiment assignment.
 *
 * @param {boolean} asConnectedUser - Whether the user is connected.
 * @return {Function} A function that fetches an experiment assignment.
 */
const fetchExperimentAssignmentWithConnectedUser = async ( {
	experimentName,
}: {
	experimentName: string;
} ): Promise< unknown > => {
	const params = {
		experiment_name: experimentName,
		anon_id: undefined,
		as_connected_user: true,
	};

	debug( 'params', params );

	const assignmentsRequestUrl = addQueryArgs(
		'https://public-api.wordpress.com/wpcom/v2/experiments/0.1.0/assignments/jetpack',
		params
	);

	debug( 'assignmentsRequestUrl', assignmentsRequestUrl );

	return apiFetch( {
		url: assignmentsRequestUrl,
		credentials: 'include',
		mode: 'cors',
		global: true,
	} );
};

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

	const { loadExperimentAssignment: loadExperimentAssignmentWithAuth } = createExPlatClient( {
		fetchExperimentAssignment: fetchExperimentAssignmentWithConnectedUser,
		getAnonId: async () => null,
		logError: debug,
		isDevelopmentMode: false,
	} );

	const { variationName } = await loadExperimentAssignmentWithAuth(
		'calypso_jetpack_ai_gemini_api_202503_v1'
	);

	debug( 'variationName', variationName );

	return variationName === 'treatment';
}

export default isChromeAIAvailable;
