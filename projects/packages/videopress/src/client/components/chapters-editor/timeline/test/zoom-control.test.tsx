/* eslint-disable testing-library/prefer-user-event -- Range inputs only take fireEvent.change. */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ZoomControl from '../zoom-control';
import type { ZoomLadder } from '../zoom-ladder';

/**
 * Render the control with spy collaborators.
 *
 * @param zoom   - Current zoom factor.
 * @param ladder - The strip's zoom ladder; a bare number means a flat
 *               (no densified stops) ladder with that source zoom.
 * @return The spies and the slider element.
 */
function renderControl( zoom: number, ladder: number | ZoomLadder ) {
	const onZoomChange = jest.fn();
	const onFit = jest.fn();
	const resolved: ZoomLadder =
		typeof ladder === 'number' ? { sourceZoom: ladder, extraStops: 0 } : ladder;
	render(
		<ZoomControl zoom={ zoom } ladder={ resolved } onZoomChange={ onZoomChange } onFit={ onFit } />
	);
	const slider = screen.getByRole< HTMLInputElement >( 'slider', { name: 'Timeline zoom' } );
	return { onZoomChange, onFit, slider };
}

describe( 'ZoomControl', () => {
	it( 'offers four discrete stops with fit pinned at the left', () => {
		const { slider } = renderControl( 1, 8 );
		expect( slider ).toHaveAttribute( 'min', '0' );
		expect( slider ).toHaveAttribute( 'max', '3' );
		expect( slider ).toHaveAttribute( 'step', '1' );
		expect( slider.value ).toBe( '0' );
	} );

	it( 'maps stops onto geometric zoom factors: zoom(k) = sourceZoom^(k/3)', () => {
		// sourceZoom 8 makes the ladder exact powers of two: 1, 2, 4, 8. Render
		// mid-ladder (zoom 4 → stop 2) so every other stop is a real change —
		// React swallows change events that match the controlled value.
		const { onZoomChange, slider } = renderControl( 4, 8 );
		expect( slider.value ).toBe( '2' );

		fireEvent.change( slider, { target: { value: '3' } } );
		expect( onZoomChange ).toHaveBeenLastCalledWith( 8 );

		fireEvent.change( slider, { target: { value: '1' } } );
		expect( onZoomChange.mock.calls[ 1 ][ 0 ] ).toBeCloseTo( 2, 12 );

		fireEvent.change( slider, { target: { value: '0' } } );
		expect( onZoomChange ).toHaveBeenLastCalledWith( 1 );
	} );

	it( 'displays the nearest stop for in-between zooms without snapping the state', () => {
		// The wheel path keeps zoom continuous; the slider is only a discrete
		// view of it. zoom 3 with sourceZoom 8 sits at 1.585 stops → shown as 2.
		const { slider } = renderControl( 3, 8 );
		expect( slider.value ).toBe( '2' );
	} );

	it( 'shows fit for zooms barely above 1', () => {
		// One wheel notch up (≈1.22) rounds back to stop 0.
		const { slider } = renderControl( 1.22, 11.38 );
		expect( slider.value ).toBe( '0' );
	} );

	it( 'clamps an overshooting zoom to the top stop', () => {
		// A stale zoom past the cap (e.g. the viewport grew) must not push
		// the input out of range.
		const { slider } = renderControl( 20, 8 );
		expect( slider.value ).toBe( '3' );
	} );

	it( 'announces the 1-based level via aria-valuetext', () => {
		const { slider } = renderControl( 4, 8 );
		expect( slider ).toHaveAttribute( 'aria-valuetext', 'Zoom level 3 of 4' );
	} );

	describe( 'densified stops (extraStops > 0)', () => {
		// A long-video adaptive sheet: sourceZoom 8 with two interval-halving
		// stops → six stops total, ceiling 32.
		const ladder: ZoomLadder = { sourceZoom: 8, extraStops: 2 };

		it( 'extends the slider by one stop per interval halving', () => {
			const { slider } = renderControl( 1, ladder );
			expect( slider ).toHaveAttribute( 'min', '0' );
			expect( slider ).toHaveAttribute( 'max', '5' );
			expect( slider ).toHaveAttribute( 'step', '1' );
		} );

		it( 'doubles the zoom per densified stop past the source-density stop', () => {
			const { onZoomChange, slider } = renderControl( 8, ladder );
			expect( slider.value ).toBe( '3' );

			fireEvent.change( slider, { target: { value: '4' } } );
			expect( onZoomChange ).toHaveBeenLastCalledWith( 16 );

			fireEvent.change( slider, { target: { value: '5' } } );
			expect( onZoomChange ).toHaveBeenLastCalledWith( 32 );
		} );

		it( 'shows the top densified stop for the ceiling zoom and announces the total', () => {
			const { slider } = renderControl( 32, ladder );
			expect( slider.value ).toBe( '5' );
			expect( slider ).toHaveAttribute( 'aria-valuetext', 'Zoom level 6 of 6' );
		} );

		it( 'maps in-between densified zooms to the nearest stop', () => {
			// zoom 20 sits between stops 4 (16) and 5 (32); log-nearest is 4.
			const { slider } = renderControl( 20, ladder );
			expect( slider.value ).toBe( '4' );
		} );
	} );

	it( 'disables the slider and pins it left when there is no zoom range', () => {
		// sourceZoom 1 also exercises the log(1) = 0 guard: the position must
		// be 0, not NaN.
		const { slider } = renderControl( 1, 1 );
		expect( slider ).toBeDisabled();
		expect( slider.value ).toBe( '0' );
		expect( slider ).toHaveAttribute( 'aria-valuetext', 'Zoom level 1 of 4' );
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
