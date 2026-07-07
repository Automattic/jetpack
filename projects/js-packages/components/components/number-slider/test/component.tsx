/*
 * Range inputs have no clean user-event equivalent for setting a value, so these
 * tests drive RangeControl through fireEvent.change.
 */
/* eslint-disable testing-library/prefer-user-event */
import { jest } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import NumberSlider from '../index.tsx';

describe( 'NumberSlider', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	const getSlider = () => screen.getByRole( 'slider' ) as HTMLInputElement;

	const settle = () => {
		act( () => {
			jest.advanceTimersByTime( 200 );
		} );
	};

	it( 'renders the number slider', () => {
		render( <NumberSlider /> );
		expect( screen.getByTestId( 'number-slider' ) ).toBeInTheDocument();
	} );

	it( 'forwards onChange live for every change', () => {
		const onChange = jest.fn();
		render( <NumberSlider value={ 20 } minValue={ 20 } maxValue={ 80 } onChange={ onChange } /> );

		fireEvent.change( getSlider(), { target: { value: '50' } } );

		expect( onChange ).toHaveBeenCalledWith( 50 );
	} );

	it( 'fires onAfterChange once after the change settles', () => {
		const onAfterChange = jest.fn();
		render(
			<NumberSlider value={ 20 } minValue={ 20 } maxValue={ 80 } onAfterChange={ onAfterChange } />
		);

		fireEvent.change( getSlider(), { target: { value: '50' } } );

		// Not yet — still within the debounce window.
		expect( onAfterChange ).not.toHaveBeenCalled();

		settle();

		expect( onAfterChange ).toHaveBeenCalledTimes( 1 );
		expect( onAfterChange ).toHaveBeenCalledWith( 50 );
	} );

	it( 'debounces onAfterChange to the last value across rapid changes', () => {
		const onAfterChange = jest.fn();
		render(
			<NumberSlider value={ 20 } minValue={ 20 } maxValue={ 80 } onAfterChange={ onAfterChange } />
		);

		fireEvent.change( getSlider(), { target: { value: '40' } } );
		fireEvent.change( getSlider(), { target: { value: '55' } } );
		fireEvent.change( getSlider(), { target: { value: '70' } } );
		settle();

		expect( onAfterChange ).toHaveBeenCalledTimes( 1 );
		expect( onAfterChange ).toHaveBeenCalledWith( 70 );
	} );

	it( 'still fires onAfterChange when the consumer echoes the value back through the value prop', () => {
		const onAfterChange = jest.fn();

		const Controlled = () => {
			const [ value, setValue ] = useState( 20 );
			const handleAfterChange = ( updated: number ) => {
				setValue( updated );
				onAfterChange( updated );
			};
			return (
				<NumberSlider
					value={ value }
					minValue={ 20 }
					maxValue={ 80 }
					onAfterChange={ handleAfterChange } // eslint-disable-line react/jsx-no-bind
				/>
			);
		};

		render( <Controlled /> );

		fireEvent.change( getSlider(), { target: { value: '65' } } );
		settle();

		expect( onAfterChange ).toHaveBeenCalledTimes( 1 );
		expect( onAfterChange ).toHaveBeenCalledWith( 65 );
	} );

	it( 'reflects an external value prop change', () => {
		const { rerender } = render( <NumberSlider value={ 20 } minValue={ 20 } maxValue={ 80 } /> );
		expect( getSlider().value ).toBe( '20' );

		rerender( <NumberSlider value={ 60 } minValue={ 20 } maxValue={ 80 } /> );
		expect( getSlider().value ).toBe( '60' );
	} );

	it( 'disables the underlying control when disabled', () => {
		render( <NumberSlider value={ 20 } minValue={ 20 } maxValue={ 80 } disabled /> );
		expect( getSlider() ).toBeDisabled();
	} );
} );
