/**
 * External dependencies
 */
import { isAccessDenied } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { describeError, type DescribeErrorOptions } from '../../helpers/describe-error';
import type { DetailPageNoticeProps } from './detail-page-notice';

/**
 * `describeError()` plus the intent a `DetailPageNotice` needs.
 *
 * @param error   - The failed query error.
 * @param options - Error-state copy and retry options, as `describeError()` takes them.
 * @return The detail page notice props.
 */
export function describeDetailPageError(
	error: unknown,
	options: DescribeErrorOptions
): DetailPageNoticeProps {
	return {
		...describeError( error, options ),
		intent: isAccessDenied( error ) ? 'info' : 'error',
	};
}
