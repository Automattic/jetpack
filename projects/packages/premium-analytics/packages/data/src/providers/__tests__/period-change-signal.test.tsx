/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { act, configure, getConfig, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import {
	PERIOD_CHANGE_ATTENTION_MS,
	PERIOD_CHANGE_SIGNAL_TTL_MS,
	PeriodChangeSignalProvider,
	useRaisePeriodChange,
	useSettlePeriodChange,
} from '../period-change-signal';

const JULY = {
	from: new TZDate( 2026, 6, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 6, 31, 23, 59, 59, 999, 'UTC' ),
};

const TRAFFIC = 'analytics/traffic';
const INSIGHTS = 'analytics/insights';

function Raiser( { surface, range }: { surface: string; range: typeof JULY } ) {
	const raise = useRaisePeriodChange();
	const onClick = useCallback( () => raise( surface, range ), [ raise, surface, range ] );

	return (
		<button type="button" onClick={ onClick }>
			raise
		</button>
	);
}

type SurfaceProps = {
	surface: string;
	shown?: boolean;
};

function Surface( { surface, shown = true }: SurfaceProps ) {
	const attention = useSettlePeriodChange( surface, shown );

	return (
		<>
			<output>{ attention?.id ?? 'none' }</output>
			<span data-testid="range">{ attention?.range.from.toISOString() ?? 'no range' }</span>
		</>
	);
}

const attention = () => screen.getByRole( 'status' ).textContent;

function Scene( { surface, shown }: SurfaceProps ) {
	return (
		<PeriodChangeSignalProvider>
			<Raiser surface={ TRAFFIC } range={ JULY } />
			<Surface surface={ surface } shown={ shown } />
		</PeriodChangeSignalProvider>
	);
}

const raise = ( user: ReturnType< typeof userEvent.setup > ) =>
	user.click( screen.getByRole( 'button', { name: 'raise' } ) );

describe( 'period change signal', () => {
	let reactStrictMode: boolean;

	// Effects run, clean up and run again under Strict Mode, as they can in production.
	beforeAll( () => {
		reactStrictMode = getConfig().reactStrictMode;
		configure( { reactStrictMode: true } );
	} );

	afterAll( () => {
		configure( { reactStrictMode } );
	} );

	it( 'fires on the raise for the surface it names, with the range it was raised with', async () => {
		const user = userEvent.setup();
		render( <Scene surface={ TRAFFIC } /> );

		await raise( user );

		expect( attention() ).not.toBe( 'none' );
		expect( screen.getByTestId( 'range' ) ).toHaveTextContent( JULY.from.toISOString() );
	} );

	it( 'waits while another section shows, then fires once the named one does', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } /> );

		await raise( user );
		view.rerender( <Scene surface={ INSIGHTS } /> );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } /> );

		expect( attention() ).not.toBe( 'none' );
	} );

	it( 'fires once for rapid repeated raises before the named section shows', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } /> );

		await raise( user );
		await raise( user );
		view.rerender( <Scene surface={ TRAFFIC } /> );
		const fired = attention();
		view.rerender( <Scene surface={ TRAFFIC } /> );

		expect( fired ).not.toBe( 'none' );
		expect( attention() ).toBe( fired );
	} );

	it( 'gives each raise its own id so a repeat of the same range fires again', async () => {
		const user = userEvent.setup();
		render( <Scene surface={ TRAFFIC } /> );

		await raise( user );
		const first = attention();
		await raise( user );

		expect( first ).not.toBe( 'none' );
		expect( attention() ).not.toBe( first );
	} );

	it( 'waits while the control is hidden and fires once it shows', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ TRAFFIC } shown={ false } /> );

		await raise( user );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } shown /> );

		expect( attention() ).not.toBe( 'none' );
	} );

	it( 'discards the signal when the navigation lands on another section', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } /> );

		await raise( user );
		view.rerender( <Scene surface="analytics/subscribers" /> );
		// A later visit to the traffic section must not replay it.
		view.rerender( <Scene surface={ TRAFFIC } /> );

		expect( attention() ).toBe( 'none' );
	} );

	it( 'discards a signal older than its time to live', async () => {
		jest.useFakeTimers();
		try {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			const view = render( <Scene surface={ INSIGHTS } /> );

			await raise( user );
			act( () => {
				jest.advanceTimersByTime( PERIOD_CHANGE_SIGNAL_TTL_MS + 1 );
			} );
			view.rerender( <Scene surface={ TRAFFIC } /> );

			expect( attention() ).toBe( 'none' );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'lets the id go after the attention duration', async () => {
		jest.useFakeTimers();
		try {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			render( <Scene surface={ TRAFFIC } /> );

			await raise( user );
			expect( attention() ).not.toBe( 'none' );

			act( () => {
				jest.advanceTimersByTime( PERIOD_CHANGE_ATTENTION_MS - 1 );
			} );
			expect( attention() ).not.toBe( 'none' );

			act( () => {
				jest.advanceTimersByTime( 1 );
			} );
			expect( attention() ).toBe( 'none' );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'restarts the clock for a newer id while an older one is still drawing', async () => {
		jest.useFakeTimers();
		try {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			render( <Scene surface={ TRAFFIC } /> );

			await raise( user );
			act( () => {
				jest.advanceTimersByTime( PERIOD_CHANGE_ATTENTION_MS / 2 );
			} );
			await raise( user );
			const newer = attention();

			act( () => {
				jest.advanceTimersByTime( PERIOD_CHANGE_ATTENTION_MS - 1 );
			} );
			expect( attention() ).toBe( newer );

			act( () => {
				jest.advanceTimersByTime( 1 );
			} );
			expect( attention() ).toBe( 'none' );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'lets the id go when the control leaves the screen and does not replay it', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ TRAFFIC } /> );

		await raise( user );
		expect( attention() ).not.toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } shown={ false } /> );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } shown /> );
		expect( attention() ).toBe( 'none' );
	} );

	it( 'lets the id go when the section switches inside the attention window', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ TRAFFIC } /> );

		await raise( user );
		expect( attention() ).not.toBe( 'none' );

		view.rerender( <Scene surface={ INSIGHTS } /> );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } /> );
		expect( attention() ).toBe( 'none' );
	} );

	it( 'is inert without a provider', async () => {
		const user = userEvent.setup();
		render(
			<>
				<Raiser surface={ TRAFFIC } range={ JULY } />
				<Surface surface={ TRAFFIC } />
			</>
		);

		await raise( user );

		expect( attention() ).toBe( 'none' );
	} );
} );
