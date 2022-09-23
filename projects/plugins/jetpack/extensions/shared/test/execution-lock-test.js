import executionLock from '../execution-lock';

describe( 'Execution lock', () => {
	const ANY_LOCK_KEY = 'anyLockName';
	const ANY_OTHER_LOCK_KEY = 'anyOtherLockName';
	const ANY_RANDOM_NUMBER = 123;

	afterEach( () => {
		jest.restoreAllMocks();
		executionLock.clearAll();
	} );

	describe( 'Acquire lock tests', () => {
		test( 'Acquire lock happy case', () => {
			// Given
			jest.spyOn( Math, 'random' ).mockImplementation( () => ANY_RANDOM_NUMBER );
			const expectedLock = [ ANY_LOCK_KEY, ANY_RANDOM_NUMBER ];

			// When
			const acquireResult = executionLock.acquire( ANY_LOCK_KEY );

			// Then
			expect( acquireResult ).toEqual( expectedLock );
		} );

		test( "When a lock for the given key is already acquired we can't get a new lock for the given key", () => {
			// Given
			jest.spyOn( Math, 'random' ).mockImplementation( () => ANY_RANDOM_NUMBER );
			const expectedFirst = [ ANY_LOCK_KEY, ANY_RANDOM_NUMBER ];
			const expectedSecond = null;

			// When
			const firstResult = executionLock.acquire( ANY_LOCK_KEY );
			const secondResult = executionLock.acquire( ANY_LOCK_KEY );

			// Then
			expect( firstResult ).toEqual( expectedFirst );
			expect( secondResult ).toEqual( expectedSecond );
		} );

		test( 'We can acquire valid locks for different keys', () => {
			// Given
			jest.spyOn( Math, 'random' ).mockImplementation( () => ANY_RANDOM_NUMBER );
			const firstExpectedLock = [ ANY_LOCK_KEY, ANY_RANDOM_NUMBER ];
			const secondExpectedLock = [ ANY_OTHER_LOCK_KEY, ANY_RANDOM_NUMBER ];

			// When
			const firstLockResult = executionLock.acquire( ANY_LOCK_KEY );
			const secondLockResult = executionLock.acquire( ANY_OTHER_LOCK_KEY );

			// Then
			expect( firstLockResult ).toEqual( firstExpectedLock );
			expect( secondLockResult ).toEqual( secondExpectedLock );
		} );
	} );

	describe( 'Block execution tests', () => {
		test( "When the supplied key isn't locked we can continue with the execution flow", async () => {
			// Given
			// No initial conditions.

			// When
			await executionLock.blockExecution( ANY_LOCK_KEY );

			// Then
			// If the lock doesn't resolve the test will time out fail.
			expect( true ).toBeTruthy();
		} );

		test( 'When the supplied key is locked execution is halted until the lock is released', async () => {
			// Given
			const lock = executionLock.acquire( ANY_LOCK_KEY );
			const RELEASE_LOCK_AFTER_ANY_MS = 400;
			setTimeout( () => executionLock.release( lock ), RELEASE_LOCK_AFTER_ANY_MS );

			// When
			await executionLock.blockExecution( ANY_LOCK_KEY );

			// Then
			// If the lock doesn't resolve the test will time out and fail.
			expect( true ).toBeTruthy();
		} );

		test( 'Blocking the execution until the lock is released does not block the current thread', () => {
			// Given
			executionLock.acquire( ANY_LOCK_KEY );

			// When
			( async () => await executionLock.blockExecution( ANY_LOCK_KEY ) )();

			// Then
			// The lock will not be resolved before the test timeout, and we should reach this point.
			expect( true ).toBeTruthy();
		} );

		test( 'The time elapsed between lock checks when the execution is halted is greater than the time offSet value', async () => {
			// Given
			const lock = executionLock.acquire( ANY_LOCK_KEY );
			const RELEASE_LOCK_AFTER_90_MS = 90;
			const OFFSET_FOR_100_MS = 100;
			setTimeout( () => executionLock.release( lock ), RELEASE_LOCK_AFTER_90_MS );
			const initialTimeMillis = Date.now();

			// When
			await executionLock.blockExecution( ANY_LOCK_KEY, OFFSET_FOR_100_MS );

			// Then
			const timeElapsedInMillis = Date.now() - initialTimeMillis;
			// The time measurement can sometimes lose 1ms.
			expect( timeElapsedInMillis ).toBeGreaterThanOrEqual( OFFSET_FOR_100_MS - 1 );
			// While the delay beyond the specified time may be arbitrarily long, within the test infrastructure it shouldn't be that far off.
			expect( timeElapsedInMillis ).toBeLessThanOrEqual( OFFSET_FOR_100_MS + 20 );
		} );
	} );

	describe( 'Check lock tests', () => {
		test( 'Unlocked key returns the correct status', () => {
			// Given
			// No initial conditions.

			// When
			const isLocked = executionLock.isLocked( ANY_LOCK_KEY );

			// Then
			expect( isLocked ).toBeFalsy();
		} );

		test( 'Locked key returns the correct status', () => {
			// Given
			executionLock.acquire( ANY_LOCK_KEY );

			// When
			const isLocked = executionLock.isLocked( ANY_LOCK_KEY );

			// Then
			expect( isLocked ).toBeTruthy();
		} );
	} );

	describe( 'Release lock tests', () => {
		test( 'Lock is correctly released when there is a lock in place', () => {
			// Given
			const lock = executionLock.acquire( ANY_LOCK_KEY );

			// When
			const releaseResult = executionLock.release( lock );

			// Then
			expect( releaseResult ).toBeTruthy();
		} );

		test( "No lock is released when there isn't a lock in place", () => {
			// Given
			const lock = [ ANY_LOCK_KEY, ANY_RANDOM_NUMBER ];

			// When
			const releaseResult = executionLock.release( lock );

			// Then
			expect( releaseResult ).toBeFalsy();
		} );
	} );
} );
