/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { REST_API_VIDEOPRESS_FEATURED_STATS } from '../constants';

/**
 * Fetches the stats for VideoPress.
 *
 * @returns {object} the stats for VideoPress
 */
const videoPressStatsResolver = async () => {
	return apiFetch( { path: REST_API_VIDEOPRESS_FEATURED_STATS } );
};

export default videoPressStatsResolver;
