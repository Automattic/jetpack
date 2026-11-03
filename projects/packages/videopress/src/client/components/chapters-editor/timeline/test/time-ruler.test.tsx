import { render, screen } from '@testing-library/react';
import TimeRuler from '../time-ruler';

/**
 * The rendered tick elements.
 *
 * @return The tick nodes in document order.
 */
function getTicks(): HTMLElement[] {
	return screen.queryAllByTestId( 'chapters-timeline-ruler-tick' );
}

describe( 'TimeRuler', () => {
	it( 'places a labelled tick per adaptive step across the duration', () => {
		// pxPerMs 0.1 → the smallest step with >= 80px spacing is 1000ms.
		render( <TimeRuler durationMs={ 10000 } pxPerMs={ 0.1 } /> );
		const ticks = getTicks();
		expect( ticks ).toHaveLength( 11 );
		expect( ticks[ 0 ] ).toHaveStyle( { transform: 'translateX(0px)' } );
		expect( ticks[ 1 ] ).toHaveStyle( { transform: 'translateX(100px)' } );
		expect( ticks[ 0 ] ).toHaveTextContent( '0:00:00.0' );
		expect( ticks[ 1 ] ).toHaveTextContent( '0:00:01.0' );
		expect( ticks[ 10 ] ).toHaveTextContent( '0:00:10.0' );
	} );

	it( 'widens the step when zoomed out', () => {
		// pxPerMs 0.01 → steps below 8000ms are too dense; the pick is 10000ms.
		render( <TimeRuler durationMs={ 60000 } pxPerMs={ 0.01 } /> );
		const ticks = getTicks();
		expect( ticks ).toHaveLength( 7 );
		expect( ticks[ 1 ] ).toHaveStyle( { transform: 'translateX(100px)' } );
		expect( ticks[ 1 ] ).toHaveTextContent( '0:00:10.0' );
	} );

	it( 'renders no ticks without a usable scale or duration', () => {
		const { rerender } = render( <TimeRuler durationMs={ 10000 } pxPerMs={ 0 } /> );
		expect( getTicks() ).toHaveLength( 0 );
		rerender( <TimeRuler durationMs={ 0 } pxPerMs={ 0.1 } /> );
		expect( getTicks() ).toHaveLength( 0 );
	} );
} );
