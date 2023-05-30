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
	beforeEach( () => {
		jest.spyOn( api, 'post' );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should return speed scores', async () => {
		api.post.mockResolvedValue( mockData );

		const scores = await requestSpeedScores( 'https://example.com' );
		expect( scores ).toEqual( mockData.scores );
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
		mockData.scores.noBoost.desktop = 60;
		mockData.scores.noBoost.mobile = 50;

		expect( didScoresChange( mockData.scores ) ).toBe( true );
	} );
} );

describe( 'getScoreMovementPercentage', () => {
	it( 'returns the correct percentage of scores moved', () => {
		const mockScores = {
			current: {
				desktop: 90,
				mobile: 80,
			},
			noBoost: {
				desktop: 90,
				mobile: 80,
			},
		};

		expect( getScoreMovementPercentage( mockScores ) ).toBe( 0 );

		( mockScores.noBoost.desktop = 80 ), ( mockScores.noBoost.mobile = 70 );

		expect( getScoreMovementPercentage( mockScores ) ).toBe( 13 );
	} );
} );
