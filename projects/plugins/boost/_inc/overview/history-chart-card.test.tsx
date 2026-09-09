/* eslint-disable testing-library/prefer-user-event */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dateI18n, getSettings, setSettings } from '@wordpress/date';
import { type PropsWithChildren } from 'react';
import HistoryChartCard from './history-chart-card';
import { getHistoryWindow } from './lib/history-days';
import { getScoreTierColor } from './lib/score-utils';
import type { PerformanceHistoryData } from './lib/use-performance-history';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( './upgrade-cta', () => ( {
	__esModule: true,
	default: () => <button>Upgrade now</button>,
} ) );
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
const callbacks = { onRetry: jest.fn(), onDismissFreshStart: jest.fn() };
let queryClient: QueryClient;
function wrapper( { children }: PropsWithChildren ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
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
	expect( screen.getAllByRole( 'grid', { name: 'Bar chart' } ) ).toHaveLength( 2 );
	expect( screen.queryByText( 'Could be improved' ) ).not.toBeInTheDocument();
	for ( const [ device, tiers ] of [
		[ 'Desktop', [ 'good', 'medium', 'poor' ] ],
		[ 'Mobile', [ 'good', 'poor', 'good' ] ],
	] as const ) {
		const chart = within(
			screen.getByRole( 'region', { name: `${ device } score history` } )
		).getByTestId( 'bar-chart' );
		await waitFor( () => {
			// SVG bars do not expose an accessible role.
			// eslint-disable-next-line testing-library/no-node-access
			const bars = chart.querySelectorAll( '.visx-bar' );
			expect( bars ).toHaveLength( 30 );
			tiers.forEach( ( tier, index ) =>
				expect( bars[ index ] ).toHaveAttribute( 'fill', getScoreTierColor( tier ) )
			);
			expect( bars[ 3 ] ).toHaveAttribute( 'fill', 'var(--jetpack-boost-history-empty)' );
		} );
	}
} );

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
	await waitFor( () => {
		// SVG bars do not expose an accessible role.
		// eslint-disable-next-line testing-library/no-node-access
		const bar = chart.getByTestId( 'bar-chart' ).querySelector( '.visx-bar' );
		expect( bar ).toHaveAttribute( 'fill', 'var(--jetpack-boost-score-poor)' );
	} );
	fireEvent.keyDown( chart.getByRole( 'grid' ), { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'chart-tooltip-0' ) ).resolves.toHaveTextContent( '0 / 100' );
} );

test( 'exposes the date, grade, and both device metrics through keyboard tooltips', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
	const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
	for ( const value of [
		dateI18n( 'F j, Y', timestamp, false ),
		'Overall score',
		'Desktop score',
		'90 / 100',
		'Mobile score',
		'80 / 100',
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

test( 'shows empty days after loading and explains them on keyboard focus', async () => {
	const { rerender } = render( <HistoryChartCard isLoading { ...callbacks } />, { wrapper } );
	expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
	rerender( <HistoryChartCard data={ null } { ...callbacks } /> );
	expect( screen.getAllByRole( 'grid' ) ).toHaveLength( 2 );
	fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
	const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
	expect( tooltip ).toHaveTextContent( dateI18n( 'F j, Y', timestamp, false ) );
	expect( tooltip ).toHaveTextContent( 'No score recorded before you unlocked this feature.' );
} );

test( 'explains every empty day as preceding feature access', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const chart = screen.getAllByRole( 'grid' )[ 0 ];
	for ( const advance of [ 4, 26 ] ) {
		for ( let step = 0; step < advance; step++ ) {
			fireEvent.keyDown( chart, { key: 'ArrowRight' } );
		}
		const tooltip = await screen.findByRole( 'tooltip' );
		expect( tooltip ).toHaveTextContent( 'No score recorded before you unlocked this feature.' );
	}
} );

test( 'pages thirty days back and returns to today without allowing a future page', async () => {
	const now = new Date( '2026-03-20T12:00:00Z' );
	const previousWindow = getHistoryWindow( 1, now );
	fetchMock.mockResolvedValue( {
		status: 'success',
		JSON: { ...previousWindow, periods: [], annotations: [] },
	} );
	render( <HistoryChartCard now={ now } data={ history } { ...callbacks } />, { wrapper } );
	expect( screen.getByRole( 'button', { name: 'Next 30 days' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Previous 30 days' } ) );
	await waitFor( () =>
		expect( fetchMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				data: { JSON: { ...previousWindow, periods: [], annotations: [] } },
			} )
		)
	);
	await waitFor( () => expect( screen.getAllByRole( 'grid' ) ).toHaveLength( 2 ) );
	expect( screen.getByRole( 'button', { name: 'Next 30 days' } ) ).toHaveAttribute(
		'aria-disabled',
		'false'
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Next 30 days' } ) );
	expect( screen.getByRole( 'button', { name: 'Next 30 days' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( fetchMock ).toHaveBeenCalledTimes( 1 );
} );

test.each( [ { isError: true, data: history }, { isLoading: true } ] )(
	'offers the premium upgrade before errors or loading without rendering paid history (%o)',
	state => {
		render( <HistoryChartCard needsUpgrade { ...state } { ...callbacks } />, { wrapper } );
		expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Try again' } ) ).not.toBeInTheDocument();
	}
);
test( 'leaving one chart resets its tooltip without remounting the next chart', async () => {
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	const [ desktop, mobile ] = screen.getAllByRole( 'grid' );
	fireEvent.keyDown( desktop, { key: 'ArrowRight' } );
	await expect( screen.findByTestId( 'chart-tooltip-0' ) ).resolves.toBeInTheDocument();
	fireEvent.blur( desktop, { relatedTarget: mobile } );
	expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument();
	expect( screen.getAllByRole( 'grid' )[ 1 ] ).toBe( mobile );
	expect( desktop ).not.toBeInTheDocument();
} );

test( 'retries a failed older history window', async () => {
	const previousWindow = getHistoryWindow( 1 );
	fetchMock.mockRejectedValueOnce( new Error( 'History service unavailable' ) );
	fetchMock.mockResolvedValue( {
		status: 'success',
		JSON: { ...previousWindow, periods: [], annotations: [] },
	} );
	render( <HistoryChartCard data={ history } { ...callbacks } />, { wrapper } );
	fireEvent.click( screen.getByRole( 'button', { name: 'Previous 30 days' } ) );
	await expect( screen.findByText( 'History service unavailable' ) ).resolves.toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	await waitFor( () => expect( screen.getAllByRole( 'grid' ) ).toHaveLength( 2 ) );
	expect( fetchMock ).toHaveBeenCalledTimes( 2 );
} );

test( 'offers the premium upgrade without rendering paid history', () => {
	render( <HistoryChartCard data={ history } needsUpgrade { ...callbacks } />, { wrapper } );
	expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
	expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
} );

test( 'dismisses the paid fresh-start notice', () => {
	render( <HistoryChartCard data={ history } isFreshStart { ...callbacks } />, { wrapper } );
	fireEvent.click( screen.getByRole( 'button', { name: 'Okay, got it!' } ) );
	expect( callbacks.onDismissFreshStart ).toHaveBeenCalledTimes( 1 );
} );

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
		render( <HistoryChartCard data={ null } { ...callbacks } />, { wrapper } );
		expect( screen.getByText( `${ firstDay } – ${ lastDay }` ) ).toBeInTheDocument();
		await waitFor( () => expect( screen.getAllByText( firstDay ) ).toHaveLength( 2 ) );
		fireEvent.keyDown( screen.getAllByRole( 'grid' )[ 0 ], { key: 'ArrowRight' } );
		const tooltip = await screen.findByTestId( 'chart-tooltip-0' );
		expect( tooltip ).toHaveTextContent( dateI18n( 'F j, Y', visibleWindow.startDate, false ) );
		expect( tooltip ).toHaveTextContent( 'No score recorded before you unlocked this feature.' );
	} finally {
		setSettings( settings );
	}
} );

test( 'transitions between upgrade, error, and paid history states', () => {
	const { rerender } = render( <HistoryChartCard needsUpgrade { ...callbacks } />, { wrapper } );
	expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
	rerender( <HistoryChartCard isError { ...callbacks } /> );
	expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeInTheDocument();
	rerender( <HistoryChartCard data={ history } { ...callbacks } /> );
	expect( screen.getAllByRole( 'grid', { name: 'Bar chart' } ) ).toHaveLength( 2 );
} );

test( 'keeps upgrade and fresh-start notices silent and safe to switch while announcing errors', () => {
	// WordPress creates live regions outside the React test container.
	/* eslint-disable testing-library/no-node-access */
	const regions = [ 'polite', 'assertive' ].map( politeness => {
		const id = `a11y-speak-${ politeness }`;
		const region = document.getElementById( id ) ?? document.createElement( 'div' );
		region.id = id;
		region.className = 'a11y-speak-region';
		region.textContent = '';
		document.body.appendChild( region );
		return region;
	} );
	/* eslint-enable testing-library/no-node-access */
	const [ polite, assertive ] = regions;
	const { rerender } = render( <HistoryChartCard needsUpgrade { ...callbacks } />, { wrapper } );
	expect( polite ).toBeEmptyDOMElement();
	expect( assertive ).toBeEmptyDOMElement();
	expect( () => rerender( <HistoryChartCard isFreshStart { ...callbacks } /> ) ).not.toThrow();
	expect( screen.getByRole( 'button', { name: 'Okay, got it!' } ) ).toBeInTheDocument();
	expect( polite ).toBeEmptyDOMElement();
	expect( assertive ).toBeEmptyDOMElement();
	expect( () => rerender( <HistoryChartCard needsUpgrade { ...callbacks } /> ) ).not.toThrow();
	expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
	expect( polite ).toBeEmptyDOMElement();
	expect( assertive ).toBeEmptyDOMElement();
	rerender( <HistoryChartCard isError { ...callbacks } /> );
	expect( assertive ).toHaveTextContent( 'Failed to load performance history' );
} );
