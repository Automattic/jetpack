import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePeriodNavigation } from '../date-period-navigation';

describe( 'DatePeriodNavigation', () => {
	it.each( [
		[ 'Previous period', 'previous' ],
		[ 'Next period', 'next' ],
	] as const )( 'steps on "%s"', async ( name, direction ) => {
		const onStep = jest.fn();
		const user = userEvent.setup();

		render( <DatePeriodNavigation canStepForward onStep={ onStep } /> );

		await user.click( screen.getByRole( 'button', { name } ) );

		expect( onStep ).toHaveBeenCalledWith( direction );
	} );

	// Disabled rather than absent: the pair keeps its place in the row, and the
	// reader can see which edge they have reached.
	it.each( [
		[ 'Next period', { canStepForward: false } ],
		[ 'Previous period', { canStepForward: true, canStepBackward: false } ],
	] as const )( 'disables "%s" at the edge of the data', async ( name, props ) => {
		const onStep = jest.fn();
		const user = userEvent.setup();

		render( <DatePeriodNavigation { ...props } onStep={ onStep } /> );

		const arrow = screen.getByRole( 'button', { name } );
		expect( arrow ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 2 );

		await user.click( arrow );
		expect( onStep ).not.toHaveBeenCalled();
	} );

	it( 'greys both arrows out while disabled, focusable still', async () => {
		const onStep = jest.fn();
		const user = userEvent.setup();

		render( <DatePeriodNavigation canStepForward disabled onStep={ onStep } /> );

		const previous = screen.getByRole( 'button', { name: 'Previous period' } );
		expect( previous ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'button', { name: 'Next period' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		previous.focus();
		expect( previous ).toHaveFocus();

		await user.click( previous );
		expect( onStep ).not.toHaveBeenCalled();
	} );
} );
