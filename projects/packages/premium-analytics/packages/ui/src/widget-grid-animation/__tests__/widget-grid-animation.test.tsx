import { act, render } from '@testing-library/react';
import {
	WIDGET_GRID_KEYFRAME_CAPTIONS,
	WIDGET_GRID_KEYFRAMES,
	WIDGET_GRID_STATIC_FRAME,
} from '../keyframes';
import { WidgetGridAnimation } from '../widget-grid-animation';
import type { WidgetGridKeyframe } from '../keyframes';

const FRAME_COUNT = WIDGET_GRID_KEYFRAMES.length;
const DEFAULT_TICK = 1200 + 600;

// jsdom has no `matchMedia`, and compose keeps one subscriber per query for the
// life of the window, so a single list object is handed out and its `matches`
// flipped per test.
const reducedMotionList = {
	matches: false,
	addEventListener: () => {},
	removeEventListener: () => {},
};

function canvas( container: HTMLElement ): HTMLElement {
	return container.firstElementChild as HTMLElement;
}

function currentFrame( container: HTMLElement ): number {
	return Number( canvas( container ).getAttribute( 'data-frame' ) );
}

function tile( container: HTMLElement, id: string ): HTMLElement {
	return container.querySelector( `[data-tile="${ id }"]` ) as HTMLElement;
}

// One `act` per tick: the timer that fires inside it schedules the next one only
// once React has flushed the frame change, which happens when the `act` ends.
function advance( ms: number, ticks = 1 ) {
	for ( let tick = 0; tick < ticks; tick++ ) {
		act( () => {
			jest.advanceTimersByTime( ms );
		} );
	}
}

describe( 'WidgetGridAnimation', () => {
	// Scoped to this describe: a group file shares one test file across suites,
	// so top-level hooks would fake the timers under every other member too.
	beforeAll( () => {
		window.matchMedia = ( ( query: string ) =>
			query === '(prefers-reduced-motion: reduce)'
				? reducedMotionList
				: { ...reducedMotionList, matches: false } ) as unknown as typeof window.matchMedia;
	} );

	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		reducedMotionList.matches = false;
		jest.useRealTimers();
	} );

	afterAll( () => {
		delete ( window as { matchMedia?: unknown } ).matchMedia;
	} );

	it( 'starts on the first keyframe, placing tiles from the canvas geometry', () => {
		const { container } = render( <WidgetGridAnimation /> );

		expect( currentFrame( container ) ).toBe( 0 );

		// The chart tile collapsed at (138, 81), 56px square, on a 400×286 canvas.
		const chart = tile( container, 'chart' ).style;
		expect( chart.getPropertyValue( '--wga-x' ) ).toBe( '34.5%' );
		expect( chart.getPropertyValue( '--wga-y' ) ).toBe( '28.322%' );
		expect( chart.getPropertyValue( '--wga-width' ) ).toBe( '14%' );
		expect( chart.getPropertyValue( '--wga-height' ) ).toBe( '19.58%' );
		expect( chart.getPropertyValue( '--wga-duration' ) ).toBe( '600ms' );
	} );

	it( 'advances one keyframe per tween plus hold, and loops back to the first', () => {
		const { container } = render( <WidgetGridAnimation /> );

		advance( DEFAULT_TICK - 1 );
		expect( currentFrame( container ) ).toBe( 0 );

		advance( 1 );
		expect( currentFrame( container ) ).toBe( 1 );

		advance( DEFAULT_TICK, FRAME_COUNT - 1 );
		expect( currentFrame( container ) ).toBe( 0 );
	} );

	it( 'lets a keyframe override the shared timing', () => {
		const keyframes: WidgetGridKeyframe[] = [
			{ ...WIDGET_GRID_KEYFRAMES[ 0 ], hold: 100, duration: 50 },
			{ ...WIDGET_GRID_KEYFRAMES[ 1 ] },
		];
		const { container } = render(
			<WidgetGridAnimation keyframes={ keyframes } hold={ 1000 } duration={ 1000 } />
		);

		advance( 149 );
		expect( currentFrame( container ) ).toBe( 0 );

		advance( 1 );
		expect( currentFrame( container ) ).toBe( 1 );
		expect( tile( container, 'chart' ).style.getPropertyValue( '--wga-duration' ) ).toBe(
			'1000ms'
		);

		// The second frame carries no override, so the shared timing applies again.
		advance( 1999 );
		expect( currentFrame( container ) ).toBe( 1 );
		advance( 1 );
		expect( currentFrame( container ) ).toBe( 0 );
	} );

	it( 'stays on a pinned keyframe', () => {
		const { container } = render( <WidgetGridAnimation frame={ 3 } /> );

		advance( DEFAULT_TICK * 3 );
		expect( currentFrame( container ) ).toBe( 3 );
	} );

	it( 'holds the current keyframe while paused', () => {
		const { container, rerender } = render( <WidgetGridAnimation /> );

		advance( DEFAULT_TICK );
		expect( currentFrame( container ) ).toBe( 1 );

		rerender( <WidgetGridAnimation paused /> );
		advance( DEFAULT_TICK * 2 );
		expect( currentFrame( container ) ).toBe( 1 );

		rerender( <WidgetGridAnimation /> );
		advance( DEFAULT_TICK );
		expect( currentFrame( container ) ).toBe( 2 );
	} );

	it( 'shows the static keyframe, still, when the reader prefers reduced motion', () => {
		reducedMotionList.matches = true;
		const { container } = render( <WidgetGridAnimation /> );

		expect( currentFrame( container ) ).toBe( WIDGET_GRID_STATIC_FRAME );

		advance( DEFAULT_TICK * 2 );
		expect( currentFrame( container ) ).toBe( WIDGET_GRID_STATIC_FRAME );
	} );

	it( 'shows each tile the content its keyframe gives it', () => {
		const { container, rerender } = render( <WidgetGridAnimation frame={ 0 } /> );
		expect( tile( container, 'chart' ) ).toHaveAttribute( 'data-content', 'icon' );
		expect( tile( container, 'pages' ) ).toHaveAttribute( 'data-content', 'icon' );

		rerender( <WidgetGridAnimation frame={ 4 } /> );
		expect( tile( container, 'chart' ) ).toHaveAttribute( 'data-content', 'chart' );
		expect( tile( container, 'people' ) ).toHaveAttribute( 'data-content', 'rows' );
		expect( tile( container, 'pages' ) ).toHaveAttribute( 'data-content', 'rows' );

		rerender( <WidgetGridAnimation frame={ 6 } /> );
		expect( tile( container, 'pages' ) ).toHaveAttribute( 'data-content', 'donut' );
	} );

	it( 'captions every keyframe of the storyboard', () => {
		expect( WIDGET_GRID_KEYFRAME_CAPTIONS ).toHaveLength( WIDGET_GRID_KEYFRAMES.length );
	} );

	it( 'is decorative: hidden from assistive technology', () => {
		const { container } = render( <WidgetGridAnimation /> );

		expect( canvas( container ) ).toHaveAttribute( 'aria-hidden', 'true' );
	} );
} );
