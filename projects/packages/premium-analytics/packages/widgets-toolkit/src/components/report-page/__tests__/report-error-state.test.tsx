/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../../../../tests/js/notice-test-utils';
import { ReportErrorState } from '../report-error-state';

const RETRY_COPY = "We couldn't load clicks. Please try again in a moment.";

function buildState( status: { isError: boolean; error?: unknown; refetch?: () => unknown } ) {
	return (
		<ReportErrorState
			status={ { error: null, refetch: jest.fn(), ...status } }
			retryDescription={ RETRY_COPY }
		>
			<p>Report table</p>
		</ReportErrorState>
	);
}

describe( 'ReportErrorState', () => {
	it( 'replaces the report sections with a notice whose Retry refetches', async () => {
		const refetch = jest.fn();
		const { rerender } = render( buildState( { isError: false, refetch } ) );

		expect( screen.getByText( 'Report table' ) ).toBeInTheDocument();

		rerender( buildState( { isError: true, refetch } ) );

		expect( getNoticeText( RETRY_COPY ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Report table' ) ).not.toBeInTheDocument();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'offers no Retry when the request is denied', () => {
		render( buildState( { isError: true, error: { error: 'unauthorized', status: 403 } } ) );

		expect( getNoticeText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
