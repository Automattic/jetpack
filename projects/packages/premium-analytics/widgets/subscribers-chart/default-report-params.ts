/**
 * External dependencies
 */
import { defaultReportParamsForGrain } from '@jetpack-premium-analytics/fields';
/**
 * Internal dependencies
 */
import { SUBSCRIBERS_GRAIN } from './grain';

// The host feeds `example.attributes` to the header control and the saved
// attributes to the body, so each needs this default and a second one drifts.
export const DEFAULT_REPORT_PARAMS = defaultReportParamsForGrain( SUBSCRIBERS_GRAIN );
