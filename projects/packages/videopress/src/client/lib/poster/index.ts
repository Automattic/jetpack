/**
 * External dependencies
 */
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
	return apiFetch( {
		path: `/wpcom/v2/videopress/${ guid }/poster`,
		method: 'POST',
		data: {
			at_time: atTime,
			is_millisec: true,
		},
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
