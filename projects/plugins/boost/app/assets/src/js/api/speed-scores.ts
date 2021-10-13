/**
 * External dependencies
 */
import api from './api';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
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
	noBoost: SpeedScores;
};

type ParsedApiResponse = {
	status: string;
	scores?: SpeedScoresSet;
};

/**
 * Kick off a request to generate speed scores for this site. Will automatically
 * poll for a response until the task is done, returning a SpeedScores object.
 *
 * @param {boolean} force Force regenerate speed scores.
 * @return {SpeedScoresSet} Speed scores returned by the server.
 */
export async function requestSpeedScores( force = false ): Promise< SpeedScoresSet > {
	// Request metrics
	const response = parseResponse(
		await api.post( force ? '/speed-scores/refresh' : '/speed-scores', {
			url: Jetpack_Boost.site.url,
		} )
	);

	// If the response contains ready-to-use metrics, we're done here.
	if ( response.scores ) {
		return response.scores;
	}

	// Poll for metrics.
	return await pollRequest();
}

/**
 * Helper method for parsing a response from a speed score API request. Returns
 * scores (if ready), and a status (success|pending|error).
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
			status: 'success',
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
				noBoost: isJsonObject( response.scores.noBoost )
					? {
							mobile: castToNumber( response.scores.noBoost.mobile, 0 ),
							desktop: castToNumber( response.scores.noBoost.desktop, 0 ),
					  }
					: null,
			},
		};
	}

	const requestStatus = castToString( response.status );
	if ( ! requestStatus ) {
		throw new Error( __( 'Invalid response while requesting metrics', 'jetpack-boost' ) );
	}

	return {
		status: requestStatus,
	};
}

/**
 * Poll a speed score request for results, timing out if it takes too long.
 *
 * @return {SpeedScoresSet} Speed scores returned by the server.
 */
async function pollRequest(): Promise< SpeedScoresSet > {
	return pollPromise< SpeedScoresSet >( {
		timeout: pollTimeout,
		interval: pollInterval,
		timeoutError: __( 'Timed out while waiting for speed-score.', 'jetpack-boost' ),
		callback: async resolve => {
			const response = parseResponse(
				await api.post( '/speed-scores', { url: Jetpack_Boost.site.url } )
			);

			if ( response.scores ) {
				resolve( response.scores );
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

/**
 * Find out if scores were improved.
 *
 * Only show the speed scores if there was an improvement on either mobile or desktop, and neither worsened.
 *
 * @param {SpeedScoresSet} scores
 * @return boolean
 */
export function didScoresImprove( scores: SpeedScoresSet ): boolean {
	const current = scores.current;
	const noBoost = scores.noBoost;

	// Consider the score was improved if either desktop or mobile improved and neither worsened.
	return (
		null !== current &&
		null !== noBoost &&
		current.mobile >= noBoost.mobile &&
		current.desktop >= noBoost.desktop &&
		current.mobile + current.desktop > noBoost.mobile + noBoost.desktop &&
		( getScoreImprovementPercentage( scores ) >= 5 || current.desktop + current.mobile > 180 )
	);
}

export function getScoreImprovementPercentage( scores: SpeedScoresSet ): number {
	const current = scores.current.mobile + scores.current.desktop;
	const noBoost = scores.noBoost.mobile + scores.noBoost.desktop;
	const improvement = current / noBoost - 1;

	return Math.round( improvement * 100 );
}
