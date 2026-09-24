/**
 * External dependencies
 */
import { defaultReportParamsForGrain } from '@automattic/jetpack-premium-analytics-api';
/**
 * Internal dependencies
 */
import { WORDADS_GRAIN } from './grain';

// The host feeds `example.attributes` to the header control and the saved
// attributes to the body, so each needs this default and a second one drifts.
export const DEFAULT_REPORT_PARAMS = defaultReportParamsForGrain( WORDADS_GRAIN );
