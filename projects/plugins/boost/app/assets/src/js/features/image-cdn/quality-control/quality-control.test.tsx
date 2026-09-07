/*
 * Range inputs have no clean user-event equivalent for setting a value, so these
 * tests drive the underlying RangeControl through fireEvent.change.
 */
/* eslint-disable testing-library/prefer-user-event */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import QualityControl from './quality-control';

/*
 * These tests lock in the behaviour that was previously covered by the now-removed
 * shared NumberSlider component and is now inlined here: the slider tracks its value
 * live, the server-side save is debounced to fire once with the settled value, and the
 * Lossless checkbox disables the slider while toggling the lossless setting. A mis-wired
 * debounce in this exact logic shipped as a P0 during the refactor, so it is worth guarding.
 */
describe( 'QualityControl', () => {
	const baseProps = {
		label: 'JPEG',
		quality: 50,
		lossless: false,
		maxValue: 80,
		minValue: 20,
		setQuality: () => {},
		setLossless: () => {},
	};

	const getSlider = () => screen.getByRole( 'slider' ) as HTMLInputElement;

	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	const settle = () => {
		act( () => {
			jest.advanceTimersByTime( 200 );
		} );
	};

	it( 'reflects the quality prop on the slider', () => {
		render( <QualityControl { ...baseProps } quality={ 50 } /> );
		expect( getSlider().value ).toBe( '50' );
	} );

	it( 'updates the slider value live while dragging', () => {
		render( <QualityControl { ...baseProps } quality={ 20 } /> );

		fireEvent.change( getSlider(), { target: { value: '65' } } );

		expect( getSlider().value ).toBe( '65' );
	} );

	it( 'does not persist the quality until the debounce settles', () => {
		const setQuality = jest.fn();
		render( <QualityControl { ...baseProps } quality={ 20 } setQuality={ setQuality } /> );

		fireEvent.change( getSlider(), { target: { value: '60' } } );

		expect( setQuality ).not.toHaveBeenCalled();

		settle();

		expect( setQuality ).toHaveBeenCalledTimes( 1 );
		expect( setQuality ).toHaveBeenCalledWith( 60 );
	} );

	it( 'debounces rapid changes and persists only the final value once', () => {
		const setQuality = jest.fn();
		render( <QualityControl { ...baseProps } quality={ 20 } setQuality={ setQuality } /> );

		fireEvent.change( getSlider(), { target: { value: '40' } } );
		fireEvent.change( getSlider(), { target: { value: '55' } } );
		fireEvent.change( getSlider(), { target: { value: '72' } } );
		settle();

		expect( setQuality ).toHaveBeenCalledTimes( 1 );
		expect( setQuality ).toHaveBeenCalledWith( 72 );
	} );

	it( 'still persists once when the consumer echoes the value back through the quality prop', () => {
		const setQuality = jest.fn();

		const Controlled = () => {
			const [ quality, setValue ] = useState( 20 );
			return (
				<QualityControl
					{ ...baseProps }
					quality={ quality }
					setQuality={ next => {
						setValue( next );
						setQuality( next );
					} }
				/>
			);
		};

		render( <Controlled /> );

		fireEvent.change( getSlider(), { target: { value: '65' } } );
		settle();

		expect( setQuality ).toHaveBeenCalledTimes( 1 );
		expect( setQuality ).toHaveBeenCalledWith( 65 );
	} );

	it( 'disables the slider when lossless is enabled', () => {
		render( <QualityControl { ...baseProps } quality={ 50 } lossless={ true } /> );

		expect( getSlider().disabled ).toBe( true );
	} );

	it( 'leaves the slider enabled when lossless is off', () => {
		render( <QualityControl { ...baseProps } quality={ 50 } lossless={ false } /> );

		expect( getSlider().disabled ).toBe( false );
	} );

	it( 'toggles the lossless setting when the checkbox is clicked', () => {
		const setLossless = jest.fn();
		render( <QualityControl { ...baseProps } lossless={ false } setLossless={ setLossless } /> );

		fireEvent.click( screen.getByLabelText( 'Lossless' ) );

		expect( setLossless ).toHaveBeenCalledTimes( 1 );
		expect( setLossless ).toHaveBeenCalledWith( true );
	} );
} );
