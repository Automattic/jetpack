/**
 * External dependencies
 */
import { defaultReportParamsForGrain } from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { WORDADS_GRAIN } from './grain';

// The host feeds `example.attributes` to the header control and the saved attributes to
// the body, so both read this, per use: the default follows the reader's remembered preset.
export const defaultReportParams = () => defaultReportParamsForGrain( WORDADS_GRAIN );
