/**
 * External dependencies
 */
import { seen } from '@wordpress/icons';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type VisitorsOverTimeAttributes = Record< never, never >;

export default {
	icon: seen,
};
