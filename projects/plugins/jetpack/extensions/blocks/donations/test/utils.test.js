import { checkAmountRange, firstShownInterval } from '../utils';

describe( 'firstShownInterval', () => {
	test( 'returns one-time when it is shown', () => {
		expect( firstShownInterval( true, true, true ) ).toBe( 'one-time' );
		expect( firstShownInterval( true, false, false ) ).toBe( 'one-time' );
	} );

	test( 'skips one-time and returns monthly when one-time is hidden', () => {
		expect( firstShownInterval( false, true, true ) ).toBe( '1 month' );
		expect( firstShownInterval( false, true, false ) ).toBe( '1 month' );
	} );

	test( 'returns annual when only annual is shown', () => {
		expect( firstShownInterval( false, false, true ) ).toBe( '1 year' );
	} );

	test( 'returns null when all are hidden', () => {
		expect( firstShownInterval( false, false, false ) ).toBeNull();
	} );
} );

describe( 'checkAmountRange', () => {
	const MIN_ERROR = 'Minimum is $10.';
	const MAX_ERROR = 'Maximum is $100.';

	test( 'returns null when no limits are set', () => {
		expect( checkAmountRange( 50, null, null, MIN_ERROR, MAX_ERROR ) ).toBeNull();
	} );

	test( 'returns null when amount is within range', () => {
		expect( checkAmountRange( 50, 10, 100, MIN_ERROR, MAX_ERROR ) ).toBeNull();
	} );

	test( 'returns null when amount equals the minimum', () => {
		expect( checkAmountRange( 10, 10, 100, MIN_ERROR, MAX_ERROR ) ).toBeNull();
	} );

	test( 'returns null when amount equals the maximum', () => {
		expect( checkAmountRange( 100, 10, 100, MIN_ERROR, MAX_ERROR ) ).toBeNull();
	} );

	test( 'returns minError when amount is below minimum', () => {
		expect( checkAmountRange( 5, 10, 100, MIN_ERROR, MAX_ERROR ) ).toBe( MIN_ERROR );
	} );

	test( 'returns maxError when amount is above maximum', () => {
		expect( checkAmountRange( 150, 10, 100, MIN_ERROR, MAX_ERROR ) ).toBe( MAX_ERROR );
	} );

	test( 'returns minError with only a minimum set', () => {
		expect( checkAmountRange( 1, 10, null, MIN_ERROR, MAX_ERROR ) ).toBe( MIN_ERROR );
		expect( checkAmountRange( 10, 10, null, MIN_ERROR, MAX_ERROR ) ).toBeNull();
	} );

	test( 'returns maxError with only a maximum set', () => {
		expect( checkAmountRange( 200, null, 100, MIN_ERROR, MAX_ERROR ) ).toBe( MAX_ERROR );
		expect( checkAmountRange( 100, null, 100, MIN_ERROR, MAX_ERROR ) ).toBeNull();
	} );
} );
