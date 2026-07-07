/* eslint-disable testing-library/prefer-user-event -- Range inputs only take fireEvent.change. */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioEditorZoomControl from '../zoom-control';

/**
 * Render the control with spy collaborators.
 *
 * @param zoom    - Current zoom factor.
 * @param zoomMax - Maximum zoom factor.
 * @return The spies and the slider element.
 */
function renderControl( zoom: number, zoomMax: number ) {
	const onZoomChange = jest.fn();
	const onFit = jest.fn();
	render(
		<StudioEditorZoomControl
			zoom={ zoom }
			zoomMax={ zoomMax }
			onZoomChange={ onZoomChange }
			onFit={ onFit }
		/>
	);
	const slider = screen.getByRole< HTMLInputElement >( 'slider', { name: 'Timeline zoom' } );
	return { onZoomChange, onFit, slider };
}

describe( 'StudioEditorZoomControl', () => {
	it( 'maps zoom onto the slider logarithmically over [1, zoomMax]', () => {
		// log(4) / log(16) = 0.5 → the geometric midpoint sits mid-travel.
		const { onZoomChange, slider } = renderControl( 4, 16 );
		expect( slider.value ).toBe( '50' );

		fireEvent.change( slider, { target: { value: '100' } } );
		expect( onZoomChange ).toHaveBeenLastCalledWith( 16 );

		fireEvent.change( slider, { target: { value: '0' } } );
		expect( onZoomChange ).toHaveBeenLastCalledWith( 1 );
	} );

	it( 'disables the slider and pins it left when there is no zoom range', () => {
		// zoomMax 1 also exercises the log(1) = 0 guard: the position must be
		// 0, not NaN.
		const { slider } = renderControl( 1, 1 );
		expect( slider ).toBeDisabled();
		expect( slider.value ).toBe( '0' );
	} );

	it( 'disables the slider for a cap too close to 1 to be useful travel', () => {
		const { slider } = renderControl( 1, 1.04 );
		expect( slider ).toBeDisabled();
	} );

	it( 'keeps the Fit button active even with the slider disabled', async () => {
		const { onFit } = renderControl( 1, 1 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Fit' } ) );
		expect( onFit ).toHaveBeenCalledTimes( 1 );
	} );
} );
