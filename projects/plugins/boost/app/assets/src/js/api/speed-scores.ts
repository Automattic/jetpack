/**
 * External dependencies
 */
import api from './api';
import { __ } from '@wordpress/i18n';

/**
 * Internal depdencies
 */
import { standardizeError } from '../utils/standardize-error';
import { isJsonObject, JSONObject } from '../utils/json-types';
import { castToNumber } from '../utils/cast-to-number';
import pollPromise from '../utils/poll-promise';
import { castToString } from '../utils/cast-to-string';

const pollTimeout = 2 * 60 * 1000;
const pollInterval = 5 * 1000;

type SpeedScores = {
	mobile: number;
	desktop: number;
};

type SpeedScoresSet = {
	current: SpeedScores;
	previous: SpeedScores;
};

type ParsedApiResponse = {
	id?: string;
	scores?: SpeedScoresSet;
};

function getResponseSpeedScoresSet( response: ParsedApiResponse ): SpeedScoresSet {
	return response.scores;
}

/**
 * Clear the speed-score cache.
 */
export async function clearCache(): Promise< void > {
	await api.delete( '/speed-scores', {
		url: Jetpack_Boost.site.url,
	} );
}

/**
 * Kick off a request to generate speed scores for this site. Will automatically
 * poll for a response until the task is done, returning a SpeedScores object.
 *
 * @return {SpeedScores} Speed scores returned by the server.
 */
export async function requestSpeedScores(): Promise< SpeedScoresSet > {
	// Request metrics
	const response = parseResponse(
		await api.post( '/speed-scores', { url: Jetpack_Boost.site.url } )
	);

	// If the response contains ready-to-use metrics, we're done here.
	if ( response.scores ) {
		return getResponseSpeedScoresSet( response );
	}

	// Poll for metrics.
	return await pollRequest( response.id );
}

/**
 * Helper method for parsing a response from a speed score API request. Returns
 * scores (if ready), or a request id to use for future polling if the speed
 * score is not yet ready.
 *
 * @param {JSONObject} response - API response to parse
 * @return {ParsedApiResponse} API response, processed.
 */
function parseResponse( response: JSONObject ): ParsedApiResponse {
	// Handle an explicit error
	if ( response.error ) {
		const defaultErrorMessage = __(
			'An unknown error occurred while requesting metrics',
			'jetpack-boost'
		);

		throw standardizeError( response.error, defaultErrorMessage );
	}

	// Check if ready.
	if ( isJsonObject( response.scores ) ) {
		return {
			scores: {
				current: isJsonObject( response.scores.current )
					? {
							mobile: castToNumber( response.scores.current.mobile, 0 ),
							desktop: castToNumber( response.scores.current.desktop, 0 ),
					  }
					: {
							mobile: 0,
							desktop: 0,
					  },
				previous: isJsonObject( response.scores.previous )
					? {
							mobile: castToNumber( response.scores.previous.mobile, 0 ),
							desktop: castToNumber( response.scores.previous.desktop, 0 ),
					  }
					: {
							mobile: 0,
							desktop: 0,
					  },
			},
		};
	}

	// No metrics yet. Make sure there is an id for polling.
	const requestId = castToString( response.id );
	if ( ! requestId ) {
		throw new Error( __( 'Invalid response while requesting metrics', 'jetpack-boost' ) );
	}

	// If not ready, return the response id for polling.
	return {
		id: requestId,
	};
}

/**
 * Poll a speed score request for results, timing out if it takes too long.
 *
 * @param {string} requestId - numeric id of the request.
 * @return {SpeedScores} Speed scores returned by the server.
 */
async function pollRequest( requestId: string ): Promise< SpeedScoresSet > {
	return pollPromise< SpeedScoresSet >( {
		timeout: pollTimeout,
		interval: pollInterval,
		timeoutError: __( 'Timed out while waiting for speed-score.', 'jetpack-boost' ),
		callback: async resolve => {
			const response = parseResponse( await api.post( `/speed-scores/${ requestId }/update` ) );

			if ( response.scores ) {
				resolve( getResponseSpeedScoresSet( response ) );
			}
		},
	} );
}

/**
 * Given a mobile and desktop score, return a letter summarizing the overall
 * score.
 *
 * @param {number} mobile  Mobile speed score
 * @param {number} desktop Desktop speed score
 * @return {string} letter score
 */
export function getScoreLetter( mobile: number, desktop: number ): string {
	const sum = mobile + desktop;
	const averageScore = sum / 2;

	if ( averageScore > 90 ) {
		return 'A';
	}
	if ( averageScore > 75 ) {
		return 'B';
	}
	if ( averageScore > 50 ) {
		return 'C';
	}
	if ( averageScore > 35 ) {
		return 'D';
	}
	if ( averageScore > 25 ) {
		return 'E';
	}
	return 'F';
}
