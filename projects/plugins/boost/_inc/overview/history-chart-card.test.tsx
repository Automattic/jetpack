/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HistoryChartCard, { buildHistorySeries, HistoryTooltip } from './history-chart-card';
import type { PerformanceHistoryData } from './lib/use-performance-history';

jest.mock( './upgrade-cta', () => ( {
	__esModule: true,
	default: () => <button>Upgrade now</button>,
} ) );
jest.mock( '../../app/assets/src/js/lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
} ) );

const timestamp = Date.UTC( 2026, 8, 1 );
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
const history: NonNullable< PerformanceHistoryData > = {
	startDate: timestamp,
	endDate: timestamp + 86400000,
	periods: [
		{ timestamp, dimensions },
		{ timestamp: timestamp + 86400000, dimensions },
	],
	annotations: [ { timestamp, text: 'Image CDN enabled' } ],
};
const callbacks = { onRetry: jest.fn(), onDismissFreshStart: jest.fn() };

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

beforeEach( () => jest.clearAllMocks() );
afterAll( () => jest.restoreAllMocks() );

test( 'renders actual Charts lines and annotations using millisecond history dates', async () => {
	const { container } = render( <HistoryChartCard data={ history } { ...callbacks } /> );
	expect( screen.getByRole( 'grid', { name: /line chart/i } ) ).toBeInTheDocument();
	expect( screen.getByText( 'Desktop' ) ).toBeInTheDocument();
	expect( screen.getByText( 'Mobile' ) ).toBeInTheDocument();
	await expect( screen.findByText( 'Image CDN enabled' ) ).resolves.toBeTruthy();
	for ( const color of [ '#1d4ed8', '#16a34a' ] ) {
		// SVG series paths do not expose an accessible role.
		// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
		expect( container.querySelector( `path[stroke="${ color }"]` )?.getAttribute( 'd' ) ).toMatch(
			/^M/
		);
	}
	expect( buildHistorySeries( history )[ 0 ].data[ 0 ] ).toEqual( {
		date: new Date( '2026-09-01T00:00:00Z' ),
		value: 90,
	} );
} );

test( 'renders visible glyphs for a single recorded period', async () => {
	const { container } = render(
		<HistoryChartCard data={ { ...history, periods: [ history.periods[ 0 ] ] } } { ...callbacks } />
	);
	await waitFor( () => {
		for ( const color of [ '#1d4ed8', '#16a34a' ] ) {
			// SVG series glyphs do not expose an accessible role.
			// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
			expect( container.querySelector( `circle[fill="${ color }"]` ) ).toHaveAttribute( 'r', '4' );
		}
	} );
} );

test( 'keeps the WordPress date and all eight history dimensions in the tooltip', () => {
	render(
		<HistoryTooltip
			period={ { ...history.periods[ 0 ], timestamp: new Date( 2026, 8, 1, 12 ).getTime() } }
		/>
	);
	for ( const value of [
		'September 1, 2026',
		'90 / 100',
		'80 / 100',
		'0.01',
		'1.20s',
		'0.20s',
		'0.03',
		'2.40s',
		'0.40s',
	] ) {
		expect( screen.getByText( value ) ).toBeInTheDocument();
	}
} );

test( 'offers the premium upgrade without rendering paid history', () => {
	render( <HistoryChartCard data={ history } needsUpgrade { ...callbacks } /> );
	expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
	expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
} );

test( 'dismisses the paid fresh-start notice', () => {
	render( <HistoryChartCard data={ history } isFreshStart { ...callbacks } /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Okay, got it!' } ) );
	expect( callbacks.onDismissFreshStart ).toHaveBeenCalledTimes( 1 );
} );

test( 'shows the history error message and offers retry', () => {
	render(
		<HistoryChartCard
			isError
			error={ new Error( 'History service unavailable' ) }
			{ ...callbacks }
		/>
	);
	expect( screen.getByText( 'History service unavailable' ) ).toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	expect( callbacks.onRetry ).toHaveBeenCalledTimes( 1 );
} );

test( 'waits for the initial fetch before showing the empty state', () => {
	const { rerender } = render( <HistoryChartCard isLoading { ...callbacks } /> );
	expect( screen.queryByText( /Performance history will appear/ ) ).not.toBeInTheDocument();
	rerender( <HistoryChartCard { ...callbacks } /> );
	expect( screen.getByText( /Performance history will appear/ ) ).toBeInTheDocument();
} );

test( 'transitions between upgrade, error, and paid history states', () => {
	const { rerender } = render( <HistoryChartCard needsUpgrade { ...callbacks } /> );
	expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
	rerender( <HistoryChartCard isError { ...callbacks } /> );
	expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeInTheDocument();
	rerender( <HistoryChartCard data={ history } { ...callbacks } /> );
	expect( screen.getByRole( 'grid', { name: /line chart/i } ) ).toBeInTheDocument();
} );
