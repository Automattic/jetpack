import { useStatsAuthor, useStatsAuthorAllTime } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useAuthorAllTimeStart } from './use-author-all-time-start';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsAuthor: jest.fn(),
	useStatsAuthorAllTime: jest.fn(),
} ) );

const mockAllTime = useStatsAuthorAllTime as jest.Mock;
const mockApproximate = useStatsAuthor as jest.Mock;

const query = ( overrides: Record< string, unknown > = {} ) => ( {
	data: undefined,
	isPlaceholderData: false,
	isLoading: false,
	isError: false,
	error: null,
	refetch: jest.fn(),
	...overrides,
} );

const TOO_MANY_POSTS = { error: 'too_many_posts', status: 400 };

describe( 'useAuthorAllTimeStart', () => {
	it.each( [
		[
			'starts where the all-time table starts, not at the first published content',
			query( { data: { startDate: '2021-03-02', firstContentDate: '2023-07-04 10:00:00' } } ),
			query(),
			{ allTimeStart: '2021-03-02', isPending: false },
		],
		[
			'ignores another author’s start held as placeholder data',
			query( { data: { startDate: '2021-03-02' }, isPlaceholderData: true, isLoading: true } ),
			query(),
			{ allTimeStart: undefined, isPending: true },
		],
		[
			'keeps its start when a background refetch fails',
			query( { data: { startDate: '2021-03-02' }, isError: true, error: { status: 503 } } ),
			query(),
			{ allTimeStart: '2021-03-02', isPending: false },
		],
		[
			'falls back to the first published content, read as GMT, past the post limit',
			query( { isError: true, error: TOO_MANY_POSTS } ),
			query( { data: { firstContentDate: '2023-07-04 10:00:00' } } ),
			{ allTimeStart: '2023-07-04T10:00:00Z', isPending: false },
		],
	] )( '%s', ( _name, allTime, approximate, expected ) => {
		mockAllTime.mockReturnValue( allTime );
		mockApproximate.mockReturnValue( approximate );

		const { result } = renderHook( () => useAuthorAllTimeStart( 7 ) );

		expect( result.current ).toMatchObject( expected );
		expect( mockApproximate ).toHaveBeenLastCalledWith(
			7,
			{ period: 'day', num: 1, approximate: true },
			{ enabled: allTime.error === TOO_MANY_POSTS }
		);
	} );
} );
