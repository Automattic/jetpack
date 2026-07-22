/**
 * Internal dependencies
 */
import { describeError } from '../describe-error';

const RETRY_DESCRIPTION = "We couldn't load device data. Please try again in a moment.";

describe( 'describeError', () => {
	it( 'describes a 403 as a neutral error without actions', () => {
		const descriptor = describeError(
			{ error: 'unauthorized', status: 403 },
			{ retryDescription: RETRY_DESCRIPTION, onRetry: jest.fn() }
		);

		expect( descriptor ).toEqual( {
			description: "You don't have access to this data.",
		} );
		expect( descriptor ).not.toHaveProperty( 'actions' );
	} );

	it( 'keeps a no_connection 403 retryable — a broken connection can heal', () => {
		const onRetry = jest.fn();
		const descriptor = describeError(
			{ error: 'no_connection', status: 403 },
			{ retryDescription: RETRY_DESCRIPTION, onRetry }
		);

		expect( descriptor.description ).toBe( RETRY_DESCRIPTION );
		expect( descriptor.actions ).toEqual( [ { label: 'Retry', onClick: onRetry } ] );
	} );

	it( 'describes a generic failure with the retryable copy and a retry action', () => {
		const onRetry = jest.fn();
		const descriptor = describeError(
			{ status: 500 },
			{ retryDescription: RETRY_DESCRIPTION, onRetry }
		);

		expect( descriptor.description ).toBe( RETRY_DESCRIPTION );
		expect( descriptor.actions ).toEqual( [ { label: 'Retry', onClick: onRetry } ] );
	} );

	it( 'keeps an unexpected 404 retryable', () => {
		const onRetry = jest.fn();
		const descriptor = describeError(
			{ status: 404 },
			{ retryDescription: RETRY_DESCRIPTION, onRetry }
		);

		expect( descriptor.actions ).toEqual( [ { label: 'Retry', onClick: onRetry } ] );
	} );

	it( 'returns the retryable descriptor when there is no error — widgets call it on every render', () => {
		const onRetry = jest.fn();

		for ( const noError of [ null, undefined ] ) {
			const descriptor = describeError( noError, {
				retryDescription: RETRY_DESCRIPTION,
				onRetry,
			} );

			expect( descriptor.description ).toBe( RETRY_DESCRIPTION );
			expect( descriptor.actions ).toEqual( [ { label: 'Retry', onClick: onRetry } ] );
		}
	} );
} );
