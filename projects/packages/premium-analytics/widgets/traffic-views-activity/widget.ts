/**
 * WordPress dependencies
 */
import { trendingUp } from '@wordpress/icons';

/**
 * Allows host fields to intersect without resolving them to `never`.
 */
export type TrafficViewsActivityAttributes = Record< never, never >;

export default {
	icon: trendingUp,
};
