/**
 * Internal dependencies
 */
import { describeError } from '../describe-error';

describe( 'describeError', () => {
	it( 'describes a 403 as a neutral error without actions', () => {
		const descriptor = describeError(
			{ error: 'unauthorized', status: 403 },
			{ subject: 'device data', onRetry: jest.fn() }
		);

		expect( descriptor ).toEqual( {
			description: "You don't have access to this data.",
		} );
		expect( descriptor ).not.toHaveProperty( 'actions' );
	} );

	it( 'describes a generic failure with subject copy and a retry action', () => {
		const onRetry = jest.fn();
		const descriptor = describeError( { status: 500 }, { subject: 'platform data', onRetry } );

		expect( descriptor.description ).toBe(
			"We couldn't load platform data. Please try again in a moment."
		);
		expect( descriptor.actions ).toEqual( [ { label: 'Retry', onClick: onRetry } ] );

		descriptor.actions?.[ 0 ].onClick();
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps an unexpected 404 retryable', () => {
		const onRetry = jest.fn();
		const descriptor = describeError( { status: 404 }, { subject: 'UTM data', onRetry } );

		expect( descriptor.actions ).toEqual( [ { label: 'Retry', onClick: onRetry } ] );
	} );
} );
