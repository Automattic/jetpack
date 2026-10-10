/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { useSpeedScores } from './lib/hooks';
import SpeedScore from './speed-score';
import { recordBoostEvent } from '$lib/utils/analytics';

jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( './lib/hooks', () => ( {
	useSpeedScores: jest.fn(),
	useDebouncedRefreshScore: jest.fn(),
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useModulesState: () => [ { data: {} } ],
} ) );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useCriticalCssState: () => [ { status: 'success' } ],
} ) );
jest.mock( '$features/critical-css/critical-css-context/critical-css-context-provider', () => ( {
	useLocalCriticalCssGeneratorStatus: () => ( { isGenerating: false } ),
} ) );
jest.mock( '$features/lcp/lib/stores/lcp-state', () => ( {
	useLcpState: () => [ { data: {} } ],
} ) );
jest.mock( '$features/cornerstone-pages/lib/stores/cornerstone-pages', () => ( {
	useCornerstonePagesProperties: () => ( {} ),
} ) );
jest.mock( '$features/performance-history/performance-history', () => () => null );
jest.mock( './context-tooltip/context-tooltip', () => () => null );
jest.mock( './pop-out/pop-out', () => () => null );

test( 'records the score card source when refreshing speed scores', () => {
	Object.assign( window, {
		Jetpack_Boost: { site: { url: 'https://example.org', online: true } },
	} );
	const loadScore = jest.fn();
	jest.mocked( useSpeedScores ).mockReturnValue( [
		{
			status: 'loaded',
			scores: { current: { mobile: 80, desktop: 90 }, noBoost: null, isStale: false },
		},
		loadScore,
	] );
	render( <SpeedScore /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Refresh' } ) );

	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'speed_score_refresh_clicked', {
		source: 'score_card',
	} );
	expect( loadScore ).toHaveBeenLastCalledWith( true );
} );
