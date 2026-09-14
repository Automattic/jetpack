/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { act, configure, render, screen } from '@testing-library/react';
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

// Effects run, clean up and run again under Strict Mode, as they can in production.
configure( { reactStrictMode: true } );

const JULY = {
	from: new TZDate( 2026, 6, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 6, 31, 23, 59, 59, 999, 'UTC' ),
};
const AUGUST = {
	from: new TZDate( 2026, 7, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 7, 31, 23, 59, 59, 999, 'UTC' ),
};
const JUNE = {
	from: new TZDate( 2026, 5, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 5, 30, 23, 59, 59, 999, 'UTC' ),
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
	applied?: typeof JULY;
	shown?: boolean;
};

function Surface( { surface, applied, shown = true }: SurfaceProps ) {
	const attentionId = useSettlePeriodChange( surface, applied, shown );

	return <output>{ attentionId ?? 'none' }</output>;
}

const attention = () => screen.getByRole( 'status' ).textContent;

function Scene( {
	surface,
	applied,
	shown,
	raiseRange = JULY,
}: SurfaceProps & { raiseRange?: typeof JULY } ) {
	return (
		<PeriodChangeSignalProvider>
			<Raiser surface={ TRAFFIC } range={ raiseRange } />
			<Surface surface={ surface } applied={ applied } shown={ shown } />
		</PeriodChangeSignalProvider>
	);
}

describe( 'period change signal', () => {
	it( 'waits while the navigation is in flight, then fires once the range lands', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } applied={ AUGUST } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ INSIGHTS } applied={ AUGUST } /> );
		view.rerender( <Scene surface={ INSIGHTS } applied={ AUGUST } /> );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( attention() ).not.toBe( 'none' );
	} );

	it( 'fires once for rapid repeated raises before the navigation lands', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } applied={ AUGUST } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );
		const fired = attention();
		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( fired ).not.toBe( 'none' );
		expect( attention() ).toBe( fired );
	} );

	it( 'fires when the range is already applied and the section switches', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } applied={ JULY } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( attention() ).not.toBe( 'none' );
	} );

	it( 'fires on a same-surface change of the applied range', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ TRAFFIC } applied={ AUGUST } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( attention() ).not.toBe( 'none' );
	} );

	it( 'gives each raise its own id so a repeat of the same range fires again', async () => {
		const user = userEvent.setup();
		render( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		const first = attention();
		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );

		expect( first ).not.toBe( 'none' );
		expect( attention() ).not.toBe( first );
	} );

	it( 'waits while the control is hidden and fires once it shows', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ TRAFFIC } applied={ JULY } shown={ false } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } shown /> );

		expect( attention() ).not.toBe( 'none' );
	} );

	it( 'discards the signal when the navigation lands on another section', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ INSIGHTS } applied={ AUGUST } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		view.rerender( <Scene surface="analytics/subscribers" applied={ AUGUST } /> );
		// A later visit to the traffic section over July must not replay it.
		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( attention() ).toBe( 'none' );
	} );

	it( 'discards the signal when the applied range lands somewhere else', async () => {
		const user = userEvent.setup();
		const view = render( <Scene surface={ TRAFFIC } applied={ AUGUST } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		view.rerender( <Scene surface={ TRAFFIC } applied={ JUNE } /> );
		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( attention() ).toBe( 'none' );
	} );

	it( 'discards the signal when the surface mounts elsewhere', async () => {
		const user = userEvent.setup();
		const view = render(
			<PeriodChangeSignalProvider>
				<Raiser surface={ TRAFFIC } range={ JULY } />
			</PeriodChangeSignalProvider>
		);

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		view.rerender( <Scene surface={ TRAFFIC } applied={ AUGUST } /> );
		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		expect( attention() ).toBe( 'none' );
	} );

	it( 'discards a signal older than its time to live', async () => {
		jest.useFakeTimers();
		try {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			const view = render( <Scene surface={ INSIGHTS } applied={ AUGUST } /> );

			await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
			act( () => {
				jest.advanceTimersByTime( PERIOD_CHANGE_SIGNAL_TTL_MS + 1 );
			} );
			view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } /> );

			expect( attention() ).toBe( 'none' );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'lets the id go after the attention duration', async () => {
		jest.useFakeTimers();
		try {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			render( <Scene surface={ TRAFFIC } applied={ JULY } /> );

			await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
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
			render( <Scene surface={ TRAFFIC } applied={ JULY } /> );

			await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
			act( () => {
				jest.advanceTimersByTime( PERIOD_CHANGE_ATTENTION_MS / 2 );
			} );
			await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
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
		const view = render( <Scene surface={ TRAFFIC } applied={ JULY } /> );

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );
		expect( attention() ).not.toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } shown={ false } /> );
		expect( attention() ).toBe( 'none' );

		view.rerender( <Scene surface={ TRAFFIC } applied={ JULY } shown /> );
		expect( attention() ).toBe( 'none' );
	} );

	it( 'is inert without a provider', async () => {
		const user = userEvent.setup();
		render(
			<>
				<Raiser surface={ TRAFFIC } range={ JULY } />
				<Surface surface={ TRAFFIC } applied={ JULY } />
			</>
		);

		await user.click( screen.getByRole( 'button', { name: 'raise' } ) );

		expect( attention() ).toBe( 'none' );
	} );
} );
