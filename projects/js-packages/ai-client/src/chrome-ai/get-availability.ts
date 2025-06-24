/**
 * External dependencies
 */
import { initializeExPlat, createExPlatClient } from '@automattic/jetpack-explat';
import { select } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
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
 * Fetch an experiment assignment.
 *
 * @param {boolean} asConnectedUser - Whether the user is connected.
 * @return {Function} A function that fetches an experiment assignment.
 */
const fetchExperimentAssignment =
	( asConnectedUser = false ) =>
	async ( {
		experimentName,
		anonId,
	}: {
		experimentName: string;
		anonId: string | null;
	} ): Promise< unknown > => {
		if ( ! anonId ) {
			debug( 'anonId is null' );
			throw new Error( `Tracking is disabled, can't fetch experimentAssignment` );
		}

		const params = {
			experiment_name: experimentName,
			anon_id: anonId ?? undefined,
			as_connected_user: asConnectedUser,
		};

		debug( 'params', params );

		const assignmentsRequestUrl = addQueryArgs(
			'https://public-api.wordpress.com/wpcom/v2/experiments/0.1.0/assignments/jetpack',
			params
		);

		debug( 'assignmentsRequestUrl', assignmentsRequestUrl );

		// using window.fetch instead of apiFetch because apiFetch only works on relative paths
		return await window.fetch( assignmentsRequestUrl );
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

	const anonId = await initializeExPlat();
	debug( 'initialized explat', anonId );

	const { loadExperimentAssignment: loadExperimentAssignmentWithAuth } = createExPlatClient( {
		fetchExperimentAssignment: fetchExperimentAssignment( true ),
		// @ts-expect-error initializeExPlat returns Promise<string | null | void> but ExPlat expects Promise<string | null>
		getAnonId: initializeExPlat,
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
