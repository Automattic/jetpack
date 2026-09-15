/**
 * WordPress dependencies
 */
import { verse } from '@wordpress/icons';

/**
 * The Posting activity widget has no configurable settings: it always shows the
 * last 12 months.
 */
export type PostingActivityAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats "Posting activity" module: one mini calendar per
 * month of the last 12, shaded by the posts published each day.
 */
export default {
	icon: verse,
};
