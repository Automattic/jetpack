import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAnalytics from '../../../hooks/use-analytics';
import { InfoTooltip } from '../index';

jest.mock( '../../../hooks/use-analytics' );

const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;
const recordEvent = jest.fn();

describe( 'InfoTooltip', () => {
	beforeEach( () => {
		recordEvent.mockClear();
		mockUseAnalytics.mockReturnValue( { recordEvent } as unknown as ReturnType<
			typeof useAnalytics
		> );
	} );

	it( 'toggles from its button and records the open only', async () => {
		render(
			<InfoTooltip tracksEventName="test_tooltip_open" tracksEventProps={ { feature: 'backup' } }>
				Tooltip content
			</InfoTooltip>
		);
		const button = screen.getByRole( 'button' );

		await userEvent.click( button );
		expect( screen.getByText( 'Tooltip content' ) ).toBeInTheDocument();

		await userEvent.click( button );
		expect( screen.queryByText( 'Tooltip content' ) ).not.toBeInTheDocument();
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_test_tooltip_open', {
			page: 'my-jetpack',
			feature: 'backup',
		} );
	} );
} );
