import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import api from '../src/api';
import {
	requestSpeedScores,
	getScoreLetter,
	didScoresChange,
	getScoreMovementPercentage,
} from '../src/index';

const mockData = {
	status: 'success',
	timestamp: 123456789,
	scores: {
		current: {
			desktop: 90,
			mobile: 80,
		},
		noBoost: {
			desktop: 90,
			mobile: 80,
		},
		isStale: true,
	},
	theme: '',
};

describe( 'requestSpeedScores', () => {
	let post: jest.SpiedFunction< typeof api.post >;

	beforeEach( () => {
		post = jest.spyOn( api, 'post' );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	} );

	it( 'should return speed scores', async () => {
		post.mockResolvedValue( mockData );

		const scores = await requestSpeedScores(
			false,
			'https://example.com/wp-json/',
			'https://example.com',
			'nonce'
		);
		expect( scores ).toEqual( mockData.scores );
		// Asserted through mock.calls rather than toHaveBeenCalledWith: the api.post
		// signature takes a JSONObject, which is recursive, and matching against it
		// pushes the checker past its instantiation limit.
		expect( post.mock.calls[ 0 ] ).toEqual( [
			'https://example.com/wp-json/',
			'/speed-scores',
			{ url: 'https://example.com' },
			'nonce',
		] );
	} );

	it( 'asks for a fresh measurement when forced', async () => {
		post.mockResolvedValue( mockData );

		const scores = await requestSpeedScores(
			true,
			'https://example.com/wp-json/',
			'https://example.com',
			'nonce'
		);

		expect( scores ).toEqual( mockData.scores );
		expect( post.mock.calls[ 0 ] ).toEqual( [
			'https://example.com/wp-json/',
			'/speed-scores/refresh',
			{ url: 'https://example.com' },
			'nonce',
		] );
	} );

	it( 'does not request scores when already cancelled', async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(
			requestSpeedScores( false, 'https://example.com/wp-json/', 'https://example.com', 'nonce', {
				signal: controller.signal,
			} )
		).resolves.toBeUndefined();
		expect( post ).not.toHaveBeenCalled();
	} );

	it( 'stops polling when cancelled between requests', async () => {
		jest.useFakeTimers();
		post.mockResolvedValue( { status: 'pending' } );
		const controller = new AbortController();
		const request = requestSpeedScores(
			false,
			'https://example.com/wp-json/',
			'https://example.com',
			'nonce',
			{ signal: controller.signal }
		);
		await jest.advanceTimersByTimeAsync( 5000 );
		expect( post ).toHaveBeenCalledTimes( 2 );

		controller.abort();
		await jest.advanceTimersByTimeAsync( 5000 );
		await expect( request ).resolves.toBeUndefined();
		await jest.advanceTimersByTimeAsync( 240000 );
		expect( post ).toHaveBeenCalledTimes( 2 );
		expect( jest.getTimerCount() ).toBe( 0 );
	} );

	it.each( [
		[ 'initial', 'success' ],
		[ 'initial', 'error' ],
		[ 'poll', 'success' ],
		[ 'poll', 'error' ],
	] )( 'discards a late %s request %s after cancellation', async ( stage, outcome ) => {
		jest.useFakeTimers();
		const controller = new AbortController();
		let resolveResponse!: ( value: typeof mockData ) => void;
		let rejectResponse!: ( error: Error ) => void;
		const response = new Promise< typeof mockData >( ( resolve, reject ) => {
			resolveResponse = resolve;
			rejectResponse = reject;
		} );
		if ( stage === 'poll' ) {
			post.mockResolvedValueOnce( { status: 'pending' } );
		}
		post.mockReturnValueOnce( response );
		const request = requestSpeedScores(
			false,
			'https://example.com/wp-json/',
			'https://example.com',
			'nonce',
			{ signal: controller.signal }
		);
		await jest.advanceTimersByTimeAsync( stage === 'poll' ? 5000 : 0 );
		const expectedRequests = stage === 'poll' ? 2 : 1;
		expect( post ).toHaveBeenCalledTimes( expectedRequests );

		controller.abort();
		if ( outcome === 'success' ) {
			resolveResponse( mockData );
		} else {
			rejectResponse( new Error( 'Request failed' ) );
		}
		await expect( request ).resolves.toBeUndefined();
		await jest.advanceTimersByTimeAsync( 240000 );
		expect( post ).toHaveBeenCalledTimes( expectedRequests );
		expect( jest.getTimerCount() ).toBe( 0 );
	} );

	it( 'returns completed scores and stops polling without cancellation', async () => {
		jest.useFakeTimers();
		post.mockResolvedValueOnce( { status: 'pending' } ).mockResolvedValueOnce( mockData );
		const request = requestSpeedScores(
			false,
			'https://example.com/wp-json/',
			'https://example.com',
			'nonce'
		);

		await jest.advanceTimersByTimeAsync( 5000 );
		await expect( request ).resolves.toEqual( mockData.scores );
		await jest.advanceTimersByTimeAsync( 240000 );
		expect( post ).toHaveBeenCalledTimes( 2 );
		expect( jest.getTimerCount() ).toBe( 0 );
	} );

	it( 'waits 240 seconds before giving up on a pending score', async () => {
		jest.useFakeTimers();
		post.mockResolvedValue( { status: 'pending' } );

		let settled = false;
		const request = requestSpeedScores(
			false,
			'https://example.com/wp-json/',
			'https://example.com',
			'nonce'
		);
		const outcome = request.then(
			() => {
				settled = true;
				return undefined;
			},
			error => {
				settled = true;
				return error;
			}
		);

		// Let the initial request resolve as pending and start the polling timers.
		await Promise.resolve();
		await jest.advanceTimersByTimeAsync( 239999 );
		expect( settled ).toBe( false );

		await jest.advanceTimersByTimeAsync( 1 );
		const error = await outcome;
		expect( error ).toBeInstanceOf( Error );
		expect( ( error as Error ).message ).toBe( 'Timed out while waiting for speed-score.' );
	} );
} );

describe( 'getScoreLetter', () => {
	it( 'Should return the correct score', () => {
		expect( getScoreLetter( 90, 91 ) ).toBe( 'A' );
		expect( getScoreLetter( 90, 83 ) ).toBe( 'B' );
		expect( getScoreLetter( 90, 60 ) ).toBe( 'C' );
		expect( getScoreLetter( 45, 50 ) ).toBe( 'D' );
		expect( getScoreLetter( 26, 30 ) ).toBe( 'E' );
		expect( getScoreLetter( 0, 0 ) ).toBe( 'F' );
	} );
} );

describe( 'didScoresChange', () => {
	it( 'Should return false if scores did not change', () => {
		expect( didScoresChange( mockData.scores ) ).toBe( false );
	} );

	it( 'should return true if scores changed', () => {
		const changedMockData = Object.assign( {}, mockData );
		changedMockData.scores.noBoost.desktop = 60;
		changedMockData.scores.noBoost.mobile = 50;

		expect( didScoresChange( changedMockData.scores ) ).toBe( true );
	} );
} );

describe( 'getScoreMovementPercentage', () => {
	it( 'returns the correct percentage of scores moved', () => {
		const changedMockData = Object.assign( {}, mockData );
		const newScores = {
			current: {
				desktop: 90,
				mobile: 80,
			},
			noBoost: {
				desktop: 90,
				mobile: 80,
			},
			isStale: true,
		};
		changedMockData.scores = newScores;

		expect( getScoreMovementPercentage( changedMockData.scores ) ).toBe( 0 );

		changedMockData.scores.noBoost.desktop = 80;
		changedMockData.scores.noBoost.mobile = 70;

		expect( getScoreMovementPercentage( changedMockData.scores ) ).toBe( 13 );
	} );
} );
