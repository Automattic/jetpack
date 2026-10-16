import { useStatsAuthorAllTimeOrApproximate } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useAuthorAllTimeStart } from './use-author-all-time-start';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsAuthorAllTimeOrApproximate: jest.fn(),
} ) );

const mockStats = useStatsAuthorAllTimeOrApproximate as jest.Mock;

const query = ( overrides: Record< string, unknown > = {} ) => ( {
	data: undefined,
	isPlaceholderData: false,
	isLoading: false,
	isError: false,
	error: null,
	refetch: jest.fn(),
	...overrides,
} );

const report = { startDate: '2021-03-02', firstContentDate: '2023-07-04 10:00:00' };

describe( 'useAuthorAllTimeStart', () => {
	it.each( [
		[
			'starts where the all-time table starts, not at the first published content',
			query( { data: { report, isApproximate: false } } ),
			{ allTimeStart: '2021-03-02', isPending: false },
		],
		[
			'ignores another author’s start held as placeholder data',
			query( { data: { report, isApproximate: false }, isPlaceholderData: true, isLoading: true } ),
			{ allTimeStart: undefined, isPending: true },
		],
		[
			'keeps its start when a background refetch fails',
			query( {
				data: { report, isApproximate: false },
				isError: true,
				error: { status: 503 },
			} ),
			{ allTimeStart: '2021-03-02', isPending: false },
		],
		[
			'falls back to the first published content, read as GMT, past the post limit',
			query( { data: { report, isApproximate: true } } ),
			{ allTimeStart: '2023-07-04T10:00:00Z', isPending: false },
		],
	] )( '%s', ( _name, stats, expected ) => {
		mockStats.mockReturnValue( stats );

		const { result } = renderHook( () => useAuthorAllTimeStart( 7 ) );

		expect( result.current ).toMatchObject( expected );
	} );
} );
