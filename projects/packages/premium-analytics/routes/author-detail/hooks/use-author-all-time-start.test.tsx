import { useStatsAuthor } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useAuthorAllTimeStart } from './use-author-all-time-start';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsAuthor: jest.fn(),
} ) );

const mockUseStatsAuthor = useStatsAuthor as jest.Mock;

describe( 'useAuthorAllTimeStart', () => {
	it.each( [
		[ 'reads the GMT first content date as an instant', false, '2023-07-04T10:00:00Z' ],
		[ 'ignores another author’s date held as placeholder data', true, undefined ],
	] )( '%s', ( _name, isPlaceholderData, expected ) => {
		mockUseStatsAuthor.mockReturnValue( {
			data: { firstContentDate: '2023-07-04 10:00:00' },
			isPlaceholderData,
			isLoading: false,
			isError: false,
			error: null,
			refetch: jest.fn(),
		} );

		const { result } = renderHook( () => useAuthorAllTimeStart( 7 ) );

		expect( result.current.allTimeStart ).toBe( expected );
		expect( mockUseStatsAuthor ).toHaveBeenCalledWith( 7, { period: 'day', num: 1 } );
	} );
} );
