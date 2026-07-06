/**
 * Internal dependencies
 */
import { describeError } from '../describe-error';

describe( 'describeError', () => {
	it( 'returns a recoverable descriptor with a Retry action for a generic error', () => {
		const onRetry = jest.fn();
		const d = describeError( new Error( 'boom' ), { onRetry } );

		expect( d.description ).toBe( "We couldn't load this data. Please try again in a moment." );
		expect( d.actions ).toHaveLength( 1 );
		expect( d.actions?.[ 0 ].label ).toBe( 'Retry' );

		d.actions?.[ 0 ].onClick();
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns an upgrade descriptor for a plan-gated (403 upgrade-required) error', () => {
		const onUpgrade = jest.fn();
		const planError = { data: { status: 403 } };
		const d = describeError( planError, { onUpgrade } );

		expect( d.description ).toBe( 'This data is available on a higher plan.' );
		expect( d.actions?.[ 0 ].label ).toBe( 'Upgrade' );

		d.actions?.[ 0 ].onClick();
		expect( onUpgrade ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'omits the Retry action when no onRetry is provided', () => {
		const d = describeError( new Error( 'boom' ) );
		expect( d.actions ).toBeUndefined();
	} );
} );
