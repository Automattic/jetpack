/* eslint-disable testing-library/prefer-user-event */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dateI18n, getSettings, setSettings } from '@wordpress/date';
import { type PropsWithChildren } from 'react';
import HistoryChartCard from './history-chart-card';
import { getHistoryWindow } from './lib/history-days';
import { getScoreTierColor } from './lib/score-utils';
import type { PerformanceHistoryData } from './lib/use-performance-history';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../app/assets/src/js/lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
} ) );
const fetchMock = jest.mocked( apiFetch );
const window = getHistoryWindow( 0 );
const timestamp = window.startDate + 12 * 3600000;
const dimensions = {
	desktop_overall_score: 90,
	mobile_overall_score: 80,
	desktop_cls: 0.01,
	desktop_lcp: 1.2,
	desktop_tbt: 0.2,
	mobile_cls: 0.03,
	mobile_lcp: 2.4,
	mobile_tbt: 0.4,
};
const history: PerformanceHistoryData = {
	...window,
	periods: [
		{ timestamp, dimensions },
		{
			timestamp: timestamp + 86400000,
			dimensions: { ...dimensions, desktop_overall_score: 70, mobile_overall_score: 30 },
		},
		{
			timestamp: timestamp + 2 * 86400000,
			dimensions: { ...dimensions, desktop_overall_score: 30, mobile_overall_score: 95 },
		},
	],
	annotations: [],
};
const callbacks = {
	onRetry: jest.fn(),
	onPrevious: jest.fn(),
	onNext: jest.fn(),
	range: window,
	dayCount: 30 as const,
	canGoNext: false,
	canGoPrevious: true,
	showSingleDate: false,
};
let queryClient: QueryClient;
function wrapper( { children }: PropsWithChildren ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

function getBars( chart: HTMLElement ) {
	// SVG bars do not expose an accessible role.

	return chart.querySelectorAll( '.visx-bar' );
}

beforeAll( () => {
	jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockReturnValue( {
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: 800,
		bottom: 300,
		width: 800,
		height: 300,
		toJSON: () => ( {} ),
	} );
	// jsdom lacks the SVG transform visx uses to map pointer coordinates.
	Object.defineProperty( SVGElement.prototype, 'getScreenCTM', {
		configurable: true,
		value: () => null,
	} );
	globalThis.ResizeObserver = class {
		constructor( private callback: ResizeObserverCallback ) {}
		observe( target: Element ) {
			this.callback(
				[ { target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry ],
				this
			);
		}
		unobserve() {}
		disconnect() {}
	};
} );

beforeEach( () => {
	jest.clearAllMocks();
	fetchMock.mockReset();
	queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	} );
	Object.defineProperty( globalThis, 'Jetpack_Boost', {
		configurable: true,
		value: { site: { online: true } },
	} );
	globalThis.window.jetpack_boost_ds = {
		rest_api: { nonce: 'rest-nonce', value: 'https://example.org/wp-json/jetpack-boost-ds/' },
		performance_history: { nonce: 'history-nonce', value: null },
	};
} );
afterEach( () => queryClient.clear() );
afterAll( () => jest.restoreAllMocks() );

test( 'renders thirty daily bars for each device using score band colours and empty slots', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	expect( screen.getByRole( 'heading', { name: 'Last 30 days', level: 2 } ) ).toBeInTheDocument();
	expect( screen.getByRole( 'heading', { name: 'Desktop', level: 3 } ) ).toBeInTheDocument();
	expect( screen.getAllByRole( 'grid', { name: 'Bar chart' } ) ).toHaveLength( 2 );
	expect( screen.queryByText( 'Could be improved' ) ).not.toBeInTheDocument();
	for ( const [ device, tiers ] of [
		[ 'Desktop', [ 'good', 'medium', 'poor' ] ],
		[ 'Mobile', [ 'good', 'poor', 'good' ] ],
	] as const ) {
		const bars = await waitFor(
			() => {
				const chart = within(
					screen.getByRole( 'region', { name: `${ device } score history` } )
				).getByTestId( 'bar-chart' );
				const renderedBars = getBars( chart );
				expect( renderedBars ).toHaveLength( 30 );
				return renderedBars;
			},
			{ timeout: 5000 }
		);
		tiers.forEach( ( tier, index ) =>
			expect( bars[ index ] ).toHaveAttribute( 'fill', getScoreTierColor( tier ) )
		);
		expect( bars[ 3 ] ).toHaveAttribute( 'fill', 'var(--jetpack-boost-history-empty)' );
		expect( bars[ 3 ] ).toHaveClass( 'boost-daily-history__bar--empty' );
	}
} );

test.each( [ 1, 2 ] )(
	'renders %i recorded days with empty stubs and the matching header',
	async count => {
		render(
			<HistoryChartCard
				data={ { ...history, periods: history.periods.slice( 0, count ) } }
				hasOlderHistory={ false }
				{ ...callbacks }
				showSingleDate={ count === 1 }
			/>,
			{ wrapper }
		);
		const label =
			count === 1
				? dateI18n( 'M j, Y', timestamp, false )
				: `${ dateI18n( 'M j', window.startDate, false ) } – ${ dateI18n( 'M j, Y', window.endDate, false ) }`;
		expect( screen.getByText( label ) ).toBeInTheDocument();
		for ( const chart of screen.getAllByTestId( 'bar-chart' ) ) {
			await waitFor( () => expect( getBars( chart ) ).toHaveLength( 30 ) );
			const bars = Array.from( getBars( chart ) );
			expect(
				bars.filter( bar => bar.getAttribute( 'fill' ) === 'var(--jetpack-boost-history-empty)' )
			).toHaveLength( 30 - count );
			expect(
				bars.slice( 0, count ).every( bar => Number( bar.getAttribute( 'height' ) ) > 0 )
			).toBe( true );
		}
	}
);

test( 'retains a recorded zero and its poor-score colour rather than treating it as missing', async () => {
	render(
		<HistoryChartCard
			data={ {
				...history,
				periods: [
					{
						timestamp,
						dimensions: { ...dimensions, desktop_overall_score: 0 },
					},
				],
			} }
			{ ...callbacks }
		/>,
		{ wrapper }
	);
	const chart = within( screen.getByRole( 'region', { name: 'Desktop score history' } ) );
	const bar = await waitFor( () => {
		const renderedBar = getBars( chart.getByTestId( 'bar-chart' ) )[ 0 ];
		expect( renderedBar ).toHaveAttribute( 'fill', 'var(--jetpack-boost-score-poor)' );
		return renderedBar;
	} );
	expect( bar ).toHaveClass( 'boost-daily-history__bar--zero' );
	expect( bar ).not.toHaveClass( 'boost-daily-history__bar--empty' );
	fireEvent.keyDown( chart.getByRole( 'grid' ), { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'chart-tooltip-0' ) ).resolves.toHaveTextContent( '0/100' );
	expect( screen.getByTestId( 'bounded-tooltip' ) ).toHaveStyle( {
		padding: '0px',
		backgroundColor: 'rgba(0, 0, 0, 0)',
		boxShadow: 'none',
	} );
} );

test( 'exposes the date, grade, and both device metrics through keyboard tooltips', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
	const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
	for ( const value of [
		dateI18n( 'F j, Y', timestamp, false ),
		'Overall score',
		'Desktop',
		'90/100',
		'Mobile',
		'80/100',
		'1.20s',
		'0.20s',
		'0.01',
		'2.40s',
		'0.40s',
		'0.03',
	] ) {
		expect( tooltip ).toHaveTextContent( value );
	}
} );

function hoverChart() {
	const chart = screen.getByTestId( 'history-chart' );
	fireEvent.mouseEnter( chart );
	fireEvent.mouseMove( chart );
	return chart;
}

test( 'keeps a recorded day popover open once the chart drops its highlight', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	const chart = hoverChart();
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	const popover = await screen.findByTestId( 'history-popover' );
	expect( desktop ).not.toContainElement( popover );
	expect( popover ).toHaveTextContent( dateI18n( 'F j, Y', timestamp, false ) );
	expect( popover ).toHaveTextContent( '90/100' );
	// Leaving the plot clears the chart's own selection while the popover stays open.
	fireEvent.keyDown( desktop, { key: 'Tab' } );
	fireEvent.blur( desktop );
	await waitFor( () =>
		expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument()
	);
	expect( screen.getByTestId( 'history-popover' ) ).toHaveTextContent( '90/100' );
	fireEvent.mouseLeave( chart );
	await waitFor( () =>
		expect( screen.queryByTestId( 'history-popover' ) ).not.toBeInTheDocument()
	);
} );

test( 'exposes a recorded day once while the popover repeats it visually', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
	const popover = await screen.findByTestId( 'history-popover' );
	expect( popover ).toHaveTextContent( '90/100' );
	const tooltip = screen.getByRole( 'tooltip' );
	expect( screen.getAllByRole( 'definition' ) ).toEqual(
		within( tooltip ).getAllByRole( 'definition' )
	);
} );

test( 'keeps the held day open when the chart is clicked', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	const chart = hoverChart();
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'history-popover' ) ).resolves.toHaveTextContent( '90/100' );
	fireEvent.keyDown( desktop, { key: 'Tab' } );
	fireEvent.blur( desktop );
	// A click within 500ms of the hover opening counts as part of that same interaction.
	await act( () => new Promise( resolve => setTimeout( resolve, 600 ) ) );
	fireEvent.click( chart );
	await waitFor( () =>
		expect( screen.getByTestId( 'history-popover' ) ).toHaveTextContent( '90/100' )
	);
} );

async function pressDay( index: number, pointerType: string ) {
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	const bar = await waitFor( () => {
		const bars = getBars( screen.getAllByTestId( 'bar-chart' )[ 0 ] );
		expect( bars ).toHaveLength( 30 );
		return bars[ index ];
	} );
	const clientX = Number( bar.getAttribute( 'x' ) ) + Number( bar.getAttribute( 'width' ) ) / 2;
	// visx owns the pointer capture rect and does not expose an attribute prop for it.
	// eslint-disable-next-line testing-library/no-node-access
	const target = desktop.querySelector( 'svg > rect[fill="transparent"]' );
	for ( const type of [ 'pointermove', 'pointerdown' ] ) {
		const event = new MouseEvent( type, { bubbles: true, clientX, clientY: 150 } );
		fireEvent( target, Object.assign( event, { pointerType } ) );
	}
	await expect( screen.findByRole( 'tooltip' ) ).resolves.toBeInTheDocument();
	fireEvent.click( target, { clientX, clientY: 150 } );
}

test( 'opens a recorded day when it is tapped by touch', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	await pressDay( 0, 'touch' );
	await expect( screen.findByTestId( 'history-popover' ) ).resolves.toHaveTextContent( '90/100' );
} );

test( 'does not open a recorded day when it is clicked with a mouse', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	await pressDay( 0, 'mouse' );
	await expect( screen.findByRole( 'tooltip' ) ).resolves.toHaveTextContent( '90/100' );
	await expect( screen.findByTestId( 'history-popover' ) ).rejects.toThrow();
} );

test( 'shows nothing beyond the empty-day tooltip when an empty day is clicked', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	await pressDay( 3, 'mouse' );
	await expect( screen.findByRole( 'tooltip' ) ).resolves.toHaveTextContent(
		'No scores recorded for this day.'
	);
	expect( screen.getByTestId( 'bounded-tooltip' ) ).toHaveStyle( {
		padding: '0px',
		backgroundColor: 'rgba(0, 0, 0, 0)',
		boxShadow: 'none',
	} );
	await expect( screen.findByTestId( 'history-popover' ) ).rejects.toThrow();
} );

test( 'shows an empty day in the popover beside its column', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	for ( let step = 0; step < 4; step++ ) {
		fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	}
	await waitFor( () =>
		expect( screen.getByTestId( 'history-popover' ) ).toHaveTextContent(
			'No scores recorded for this day.'
		)
	);
	expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'No scores recorded for this day.' );
} );

test( "keeps a keyboard-opened day showing through the chart's own keys", async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'history-popover' ) ).resolves.toBeInTheDocument();
	for ( const key of [ 'Enter', ' ', 'Home', 'a' ] ) {
		fireEvent.keyDown( screen.getByTestId( 'chart-tooltip-0' ), { key } );
		expect( screen.getByTestId( 'history-popover' ) ).toHaveTextContent( '90/100' );
	}
} );

test( 'does not reopen the day the pointer left once the chart has no highlight', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	const chart = hoverChart();
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'history-popover' ) ).resolves.toBeInTheDocument();
	fireEvent.mouseLeave( chart );
	fireEvent.keyDown( desktop, { key: 'Tab' } );
	fireEvent.blur( desktop );
	await waitFor( () =>
		expect( screen.queryByTestId( 'history-highlight' ) ).not.toBeInTheDocument()
	);
	// Returning over a device heading selects no day, so nothing is left to show.
	hoverChart();
	await expect( screen.findByTestId( 'history-popover' ) ).rejects.toThrow();
} );

test( 'follows arrow keys while the pointer rests on the chart', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	hoverChart();
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'history-popover' ) ).resolves.toHaveTextContent( '90/100' );
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await waitFor( () =>
		expect( screen.getByTestId( 'history-popover' ) ).toHaveTextContent( '70/100' )
	);
} );

test( 'opens a recorded day popover by keyboard and closes it with Escape', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const desktop = screen.getAllByRole( 'grid' )[ 0 ];
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
	await waitFor( () => expect( tooltip ).toHaveFocus() );
	expect( screen.getByTestId( 'history-popover' ) ).toHaveTextContent( '80/100' );
	fireEvent.keyDown( tooltip, { key: 'Escape' } );
	await waitFor( () =>
		expect( screen.queryByTestId( 'history-popover' ) ).not.toBeInTheDocument()
	);
	expect( desktop ).toHaveFocus();
} );

describe( 'popover placement', () => {
	let sizeSpies: jest.SpyInstance[];
	let defaultRect: () => DOMRect;
	beforeEach( () => {
		defaultRect = jest.mocked( Element.prototype.getBoundingClientRect ).getMockImplementation();
		// floating-ui measures the viewport and the popup by their client and offset sizes.
		sizeSpies = [
			jest.spyOn( document.documentElement, 'clientWidth', 'get' ).mockReturnValue( 1000 ),
			jest.spyOn( document.documentElement, 'clientHeight', 'get' ).mockReturnValue( 800 ),
			jest.spyOn( HTMLElement.prototype, 'offsetWidth', 'get' ).mockImplementation( function (
				this: HTMLElement
			) {
				return this.dataset.testid === 'history-positioner' ? 265 : 0;
			} ),
		];
	} );
	afterEach( () => {
		jest.mocked( Element.prototype.getBoundingClientRect ).mockImplementation( defaultRect );
		sizeSpies.forEach( spy => spy.mockRestore() );
	} );

	async function openBesideColumn( columnLeft: number ) {
		jest.mocked( Element.prototype.getBoundingClientRect ).mockImplementation( function (
			this: Element
		) {
			const isColumn = this.matches( '[data-testid="history-highlight"]' );
			const left = isColumn ? columnLeft : 0;
			const width = isColumn ? 20 : 800;
			return {
				x: left,
				y: 0,
				top: 0,
				left,
				right: left + width,
				bottom: 300,
				width,
				height: 300,
			} as DOMRect;
		} );
		const { unmount } = render( <HistoryChartCard data={ history } { ...callbacks } />, {
			wrapper,
		} );
		fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
		return { positioner: await screen.findByTestId( 'history-positioner' ), unmount };
	}

	test( 'opens a recorded day popover a gap away from its column', async () => {
		const { positioner } = await openBesideColumn( 100 );
		await waitFor( () => expect( positioner.style.transform ).toMatch( /^translate\(128px,/ ) );
		expect( positioner ).toHaveAttribute( 'data-side', 'inline-end' );
	} );

	test( 'flips a recorded day popover to the other side of its column near the edge', async () => {
		const { positioner } = await openBesideColumn( 900 );
		await waitFor( () => expect( positioner.style.transform ).toMatch( /^translate\(627px,/ ) );
		expect( positioner ).toHaveAttribute( 'data-side', 'inline-start' );
	} );

	test( 'drops a recorded day popover below its column when neither side fits', async () => {
		jest.spyOn( document.documentElement, 'clientWidth', 'get' ).mockReturnValue( 500 );
		const { positioner } = await openBesideColumn( 240 );
		await waitFor( () => expect( positioner ).toHaveAttribute( 'data-side', 'bottom' ) );
		const [ x, y ] = ( positioner.style.transform.match( /-?[\d.]+/g ) ?? [] ).map( Number );
		expect( x ).toBeGreaterThanOrEqual( 0 );
		expect( x + 265 ).toBeLessThanOrEqual( 500 );
		expect( y ).toBeGreaterThanOrEqual( 308 );
	} );
} );

test( 'shows empty days after loading and explains them on keyboard focus', async () => {
	const { rerender } = render( <HistoryChartCard isLoading { ...callbacks } />, { wrapper } );
	expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
	rerender( <HistoryChartCard data={ null } { ...callbacks } /> );
	expect( screen.getAllByRole( 'grid' ) ).toHaveLength( 2 );
	fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
	const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
	expect( tooltip ).toHaveTextContent( dateI18n( 'F j, Y', timestamp, false ) );
	expect( tooltip ).toHaveTextContent( 'No scores recorded for this day.' );
} );

test( 'explains empty days before the first recorded score only without older history', async () => {
	const later = {
		...history,
		periods: history.periods.map( entry => ( {
			...entry,
			timestamp: entry.timestamp + 10 * 86400000,
		} ) ),
	};
	const { rerender } = render(
		<HistoryChartCard data={ later } { ...callbacks } hasOlderHistory={ false } />,
		{ wrapper }
	);
	const chart = screen.getAllByRole( 'grid' )[ 0 ];
	const move = ( key: string, steps: number ) => {
		for ( let step = 0; step < steps; step++ ) {
			fireEvent.keyDown( chart, { key } );
		}
	};
	move( 'ArrowRight', 1 );
	await waitFor( () =>
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'No scores recorded before the feature was unlocked.'
		)
	);
	move( 'ArrowRight', 13 );
	await waitFor( () =>
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'No scores recorded for this day.' )
	);
	rerender( <HistoryChartCard data={ later } { ...callbacks } /> );
	move( 'ArrowLeft', 13 );
	await waitFor( () =>
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'No scores recorded for this day.' )
	);
}, 20000 );

test( 'shows the paging labels as tooltips on the chevrons', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } hasOlderHistory={ false } />, {
		wrapper,
	} );
	for ( const name of [ 'Previous 30 days', 'Next 30 days' ] ) {
		const button = screen.getByRole( 'button', { name } );
		fireEvent.keyDown( document.body, { key: 'Tab' } );
		act( () => button.focus() );
		await expect( screen.findByText( name, {}, { timeout: 3000 } ) ).resolves.toBeVisible();
	}
} );

test.each( [ 15, 30 ] as const )(
	'delegates %i-day paging and disables the future window',
	dayCount => {
		const { rerender } = render(
			<HistoryChartCard data={ history } { ...callbacks } dayCount={ dayCount } />,
			{ wrapper }
		);
		expect(
			screen.getByRole( 'heading', { name: `Last ${ dayCount } days`, level: 2 } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: `Next ${ dayCount } days` } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		fireEvent.click( screen.getByRole( 'button', { name: `Next ${ dayCount } days` } ) );
		expect( callbacks.onNext ).not.toHaveBeenCalled();
		fireEvent.click( screen.getByRole( 'button', { name: `Previous ${ dayCount } days` } ) );
		expect( callbacks.onPrevious ).toHaveBeenCalledTimes( 1 );
		rerender(
			<HistoryChartCard data={ history } { ...callbacks } dayCount={ dayCount } canGoNext />
		);
		fireEvent.click( screen.getByRole( 'button', { name: `Next ${ dayCount } days` } ) );
		expect( callbacks.onNext ).toHaveBeenCalledTimes( 1 );
		expect(
			screen.getByRole( 'heading', { name: 'Score history', level: 2 } )
		).toBeInTheDocument();
		rerender(
			<HistoryChartCard
				data={ history }
				{ ...callbacks }
				dayCount={ dayCount }
				canGoNext
				canGoPrevious={ false }
				hasOlderHistory={ false }
			/>
		);
		expect( screen.getByRole( 'button', { name: `Previous ${ dayCount } days` } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		fireEvent.click( screen.getByRole( 'button', { name: `Previous ${ dayCount } days` } ) );
		expect( callbacks.onPrevious ).toHaveBeenCalledTimes( 1 );
		expect( fetchMock ).not.toHaveBeenCalled();
	}
);

test( 'leaving one chart resets its tooltip without remounting the next chart', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const [ desktop, mobile ] = screen.getAllByRole( 'grid' );
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'chart-tooltip-0' ) ).resolves.toBeInTheDocument();
	fireEvent.keyDown( desktop, { key: 'Tab' } );
	fireEvent.blur( desktop, { relatedTarget: mobile } );
	expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument();
	expect( screen.getAllByRole( 'grid' )[ 1 ] ).toBe( mobile );
	expect( screen.getAllByRole( 'grid' )[ 0 ] ).toBe( desktop );
} );

test.each( [ { range: getHistoryWindow( 1 ) }, { isVisible: false } ] )(
	'clears the active highlight when the chart window or visibility changes (%o)',
	async state => {
		const { rerender, unmount } = render( <HistoryChartCard data={ history } { ...callbacks } />, {
			wrapper,
		} );
		fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
		await expect( screen.findByTestId( 'chart-tooltip-0' ) ).resolves.toBeInTheDocument();
		expect( screen.getByTestId( 'history-highlight' ) ).toBeInTheDocument();
		rerender( <HistoryChartCard data={ history } { ...callbacks } { ...state } /> );
		expect( screen.queryByTestId( 'history-highlight' ) ).not.toBeInTheDocument();
		unmount();
		expect( screen.queryByTestId( 'history-highlight' ) ).not.toBeInTheDocument();
	}
);

test( 'shows the history error message and offers retry', () => {
	render(
		<HistoryChartCard
			isError
			error={ new Error( 'History service unavailable' ) }
			{ ...callbacks }
		/>,
		{ wrapper }
	);
	expect( screen.getByText( 'History service unavailable' ) ).toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	expect( callbacks.onRetry ).toHaveBeenCalledTimes( 1 );
} );

test( 'keeps the card padding for notices and drops it only for the charts', () => {
	/* eslint-disable testing-library/no-node-access */
	const { rerender } = render( <HistoryChartCard isError { ...callbacks } />, { wrapper } );
	const zeroPaddingBody = () => document.querySelector( '.boost-daily-history__body' );
	expect( zeroPaddingBody() ).toBeNull();
	rerender( <HistoryChartCard isLoading { ...callbacks } /> );
	expect( zeroPaddingBody() ).not.toBeNull();
	rerender( <HistoryChartCard data={ history } { ...callbacks } /> );
	expect( zeroPaddingBody() ).toContainElement( screen.getAllByRole( 'grid' )[ 0 ] );
	/* eslint-enable testing-library/no-node-access */
} );

test( 'keeps the header, axis, and empty tooltip on the same day in a UTC+14 site', async () => {
	const settings = getSettings();
	setSettings( {
		...settings,
		timezone: { offset: 14, offsetFormatted: '+14', string: 'Pacific/Kiritimati', abbr: '+14' },
	} );
	try {
		const visibleWindow = getHistoryWindow( 0 );
		const firstDay = dateI18n( 'M j', visibleWindow.startDate, false );
		const lastDay = dateI18n( 'M j, Y', visibleWindow.endDate, false );
		render( <HistoryChartCard data={ null } { ...callbacks } range={ visibleWindow } />, {
			wrapper,
		} );
		expect( screen.getByText( `${ firstDay } – ${ lastDay }` ) ).toBeInTheDocument();
		await waitFor( () => expect( screen.getAllByText( firstDay ) ).toHaveLength( 2 ) );
		fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
		const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
		expect( tooltip ).toHaveTextContent( dateI18n( 'F j, Y', visibleWindow.startDate, false ) );
		expect( tooltip ).toHaveTextContent( 'No scores recorded for this day.' );
	} finally {
		setSettings( settings );
	}
} );

test( 'transitions from an error to paid history', () => {
	const { rerender } = render( <HistoryChartCard isError { ...callbacks } />, { wrapper } );
	expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeInTheDocument();
	rerender( <HistoryChartCard data={ history } { ...callbacks } /> );
	expect( screen.getAllByRole( 'grid', { name: 'Bar chart' } ) ).toHaveLength( 2 );
} );

test( 'announces history errors in the assertive live region', () => {
	// WordPress creates live regions outside the React test container.
	/* eslint-disable testing-library/no-node-access */
	const assertive =
		document.getElementById( 'a11y-speak-assertive' ) ?? document.createElement( 'div' );
	assertive.id = 'a11y-speak-assertive';
	assertive.className = 'a11y-speak-region';
	assertive.textContent = '';
	document.body.appendChild( assertive );
	/* eslint-enable testing-library/no-node-access */
	render( <HistoryChartCard isError { ...callbacks } />, { wrapper } );
	expect( assertive ).toHaveTextContent( 'Failed to load performance history' );
} );
