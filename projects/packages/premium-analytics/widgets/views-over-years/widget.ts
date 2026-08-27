/**
 * WordPress dependencies
 */
import { seen } from '@wordpress/icons';

/**
 * Allows host fields to intersect without resolving them to `never`.
 */
export type ViewsOverYearsAttributes = Record< never, never >;

export default {
	icon: seen,
};
