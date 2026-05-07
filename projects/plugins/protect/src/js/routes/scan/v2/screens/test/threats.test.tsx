import { render, screen } from '@testing-library/react';
import * as scanThreatsHook from '../../data/use-scan-threats-query';
import * as trackHook from '../../data/use-track-event';
import ThreatsScreen from '../threats';
import type { Threat } from '../../data/types';
import type { UseScanThreatsResult } from '../../data/use-scan-threats-query';

jest.mock( '@automattic/jetpack-scan', () => ( {
	ThreatsDataViews: ( { data }: { data: Threat[] } ) => (
		<div data-testid="threats-data-views">{ `rows:${ data.length }` }</div>
	),
} ) );

const baseResult: UseScanThreatsResult = {
	data: [],
	isLoading: false,
	isFetching: false,
	activeError: null,
	historyError: null,
	refetch: jest.fn(),
};

describe( 'ThreatsScreen', () => {
	beforeEach( () => {
		jest.spyOn( trackHook, 'useTrackEvent' ).mockReturnValue( jest.fn() );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders nothing while the threat query is loading', () => {
		jest.spyOn( scanThreatsHook, 'useScanThreatsQuery' ).mockReturnValue( {
			...baseResult,
			isLoading: true,
		} );

		const { container } = render( <ThreatsScreen /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders <ThreatsDataViews /> when the query resolves with data', () => {
		jest.spyOn( scanThreatsHook, 'useScanThreatsQuery' ).mockReturnValue( {
			...baseResult,
			data: [
				{ id: 'a', title: 'A', status: 'current' },
				{ id: 'b', title: 'B', status: 'fixed' },
			],
		} );

		render( <ThreatsScreen /> );
		expect( screen.getByTestId( 'threats-data-views' ) ).toHaveTextContent( 'rows:2' );
	} );

	it( 'renders the error block when the active query fails', () => {
		jest.spyOn( scanThreatsHook, 'useScanThreatsQuery' ).mockReturnValue( {
			...baseResult,
			activeError: new Error( 'boom' ),
		} );

		render( <ThreatsScreen /> );
		expect( screen.getByTestId( 'protect-scan-v2-error' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'threats-data-views' ) ).not.toBeInTheDocument();
	} );
} );
