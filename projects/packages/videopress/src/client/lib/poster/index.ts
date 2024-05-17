/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
/**
 * Types
 */
import type { VideoGUID } from '../../block-editor/blocks/video/types';

export type WPComV2VideopressPostPosterProps = {
	code: 200 | number;
	data: {
		generating: boolean;
		poster: string;
		state: 'complete';
	};
};

export const requestUpdatePosterByVideoFrame = function (
	guid: VideoGUID,
	atTime: number
): Promise< WPComV2VideopressPostPosterProps > {
	const requestBody = {
		at_time: atTime,
		is_millisec: true,
	};

	if ( isSimpleSite() ) {
		return apiFetch( {
			path: `/videos/${ guid }/poster`,
			apiNamespace: 'rest/v1.1',
			method: 'POST',
			global: true,
			data: requestBody,
		} );
	}

	return apiFetch( {
		path: `/wpcom/v2/videopress/${ guid }/poster`,
		method: 'POST',
		data: requestBody,
	} );
};

export const requestVideoPoster = function (
	guid: VideoGUID
): Promise< WPComV2VideopressPostPosterProps > {
	return apiFetch( {
		path: `/wpcom/v2/videopress/${ guid }/poster`,
		method: 'GET',
	} );
};

export const hasVideoPosterGenerated = async function ( guid: VideoGUID ): Promise< boolean > {
	const videoPosterData = await requestVideoPoster( guid );
	return ! videoPosterData.data?.generating;
};

/**
 * Polls the API to check if
 * the video poster image has been generated.
 *
 * @param {VideoGUID} guid              - The video guid.
 * @param {object} options              - Options for the polling.
 * @param {number} options.wait         - The time to wait between polls, in milliseconds.
 * @param {number} options.attemps      - The number of times to poll before giving up.
 * @param {boolean} options.initialWait - Whether to wait before the first poll.
 * @returns {Promise<boolean>}            Whether the poster image has been generated.
 */
export async function pollGeneratingPosterImage(
	guid: VideoGUID,
	{ wait = 3000, attemps = 10, initialWait = true } = {}
): Promise< boolean > {
	if ( initialWait ) {
		await new Promise( resolve => setTimeout( resolve, wait ) );
	}

	while ( ! ( await hasVideoPosterGenerated( guid ) ) ) {
		if ( attemps-- === 0 ) {
			throw new Error( 'Poster generation timed out' );
		}

		await new Promise( resolve => setTimeout( resolve, wait ) );
	}

	return true;
}
