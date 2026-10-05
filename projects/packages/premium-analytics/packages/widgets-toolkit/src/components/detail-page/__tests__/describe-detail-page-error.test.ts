/**
 * External dependencies
 */
import { StatsResponseShapeError } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { describeDetailPageError } from '../describe-detail-page-error';

const RETRY_DESCRIPTION = "We couldn't load this video. Please try again in a moment.";

describe( 'describeDetailPageError', () => {
	it( 'marks an unusable response as an error', () => {
		expect(
			describeDetailPageError( new StatsResponseShapeError( 'bad shape' ), {
				retryDescription: RETRY_DESCRIPTION,
				onRetry: jest.fn(),
			} )
		).toEqual( {
			intent: 'error',
			description: 'This data is unavailable right now.',
		} );
	} );

	it( 'marks a 403 as info, without actions', () => {
		expect(
			describeDetailPageError(
				{ error: 'unauthorized', status: 403 },
				{ retryDescription: RETRY_DESCRIPTION, onRetry: jest.fn() }
			)
		).toEqual( {
			intent: 'info',
			description: "You don't have access to this data.",
		} );
	} );

	it.each( [
		[ 'a no_connection 403', { error: 'no_connection', status: 403 } ],
		[ 'a generic failure', { status: 500 } ],
	] )( 'marks %s as a retryable error', ( _, error ) => {
		const onRetry = jest.fn();

		expect(
			describeDetailPageError( error, { retryDescription: RETRY_DESCRIPTION, onRetry } )
		).toEqual( {
			intent: 'error',
			description: RETRY_DESCRIPTION,
			actions: [ { label: 'Retry', onClick: onRetry } ],
		} );
	} );
} );
