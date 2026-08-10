/**
 * WordPress dependencies
 */
import { trendingUp } from '@wordpress/icons';

/**
 * No configurable settings. `Record< never, never >` rather than
 * `Record< string, never >` so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type TrafficViewsActivityAttributes = Record< never, never >;

/**
 * The site-wide companion to `jpa/post-traffic-activity`: daily views for the
 * whole site rather than one post, as a calendar heatmap. Days without traffic
 * stay blank while the grid stays complete.
 */
export default {
	icon: trendingUp,
};
