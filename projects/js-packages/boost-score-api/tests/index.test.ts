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
