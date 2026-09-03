import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePeriodNavigation } from '../date-period-navigation';

describe( 'DatePeriodNavigation', () => {
	it( 'steps backward', async () => {
		const onStep = jest.fn();
		const user = userEvent.setup();

		render( <DatePeriodNavigation canStepForward onStep={ onStep } /> );

		await user.click( screen.getByRole( 'button', { name: 'Previous period' } ) );

		expect( onStep ).toHaveBeenCalledWith( 'previous' );
	} );

	it( 'steps forward', async () => {
		const onStep = jest.fn();
		const user = userEvent.setup();

		render( <DatePeriodNavigation canStepForward onStep={ onStep } /> );

		await user.click( screen.getByRole( 'button', { name: 'Next period' } ) );

		expect( onStep ).toHaveBeenCalledWith( 'next' );
	} );

	/*
	 * Absent rather than disabled. A disabled arrow states a rule the reader has
	 * to work out, and on a live preset that rule holds for as long as they stay
	 * on it.
	 */
	it( 'omits the forward control while the window reaches the present', () => {
		render( <DatePeriodNavigation canStepForward={ false } onStep={ jest.fn() } /> );

		expect( screen.getByRole( 'button', { name: 'Previous period' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Next period' } ) ).not.toBeInTheDocument();
	} );
} );
