import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntervalSelector } from '@/routes/overview/interval-selector';

describe( 'IntervalSelector', () => {
	it( 'renders four interval options', () => {
		render( <IntervalSelector value="30-days" onChange={ () => {} } /> );
		expect( screen.getByRole( 'radio', { name: /30 days/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: /60 days/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: /6 months/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: /all time/i } ) ).toBeInTheDocument();
	} );

	it( 'reports the new value on change', async () => {
		const onChange = jest.fn();
		render( <IntervalSelector value="30-days" onChange={ onChange } /> );
		await userEvent.click( screen.getByRole( 'radio', { name: /6 months/i } ) );
		expect( onChange ).toHaveBeenCalledWith( '6-months' );
	} );

	it( 'marks the current value as checked', () => {
		render( <IntervalSelector value="60-days" onChange={ () => {} } /> );
		expect( screen.getByRole( 'radio', { name: /60 days/i } ) ).toBeChecked();
		expect( screen.getByRole( 'radio', { name: /30 days/i } ) ).not.toBeChecked();
	} );
} );
