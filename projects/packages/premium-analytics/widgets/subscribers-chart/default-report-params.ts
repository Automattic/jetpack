/**
 * External dependencies
 */
import { defaultReportParamsForGrain } from '@jetpack-premium-analytics/fields';
/**
 * Internal dependencies
 */
import { SUBSCRIBERS_GRAIN } from './grain';

// Read per use, not once at load: the default follows the reader's remembered preset.
export const defaultReportParams = () => defaultReportParamsForGrain( SUBSCRIBERS_GRAIN );
