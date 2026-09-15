/**
 * External dependencies
 */
import { type DateRange } from '@jetpack-premium-analytics/datetime';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';

/**
 * How long a raised signal may wait for its navigation to land before it is
 * dropped. Keeps a click that went nowhere from firing on a later,
 * hand-picked visit to the same range.
 */
export const PERIOD_CHANGE_SIGNAL_TTL_MS = 5000;

/**
 * How long a date control draws attention to a period set from elsewhere.
 * The control's fade reads this too, so the fill and the id end together.
 */
export const PERIOD_CHANGE_ATTENTION_MS = 1600;

type PeriodChangeSignal = {
	id: number;
	surface: string;
	rangeKey: string;
	raisedAt: number;
};

type Attention = {
	id: number;
	/** The surface and range the id fired on; it is let go once either moves. */
	observation: string;
};

type PeriodChangeSignalContextValue = {
	signal: PeriodChangeSignal | null;
	raise: ( surface: string, range: Required< DateRange > ) => void;
	settle: ( id: number ) => void;
};

const INERT: PeriodChangeSignalContextValue = {
	signal: null,
	raise: () => {},
	settle: () => {},
};

const PeriodChangeSignalContext = createContext< PeriodChangeSignalContextValue >( INERT );

function rangeKey( range?: DateRange ): string | undefined {
	return range?.from && range.to ? `${ range.from.getTime() }:${ range.to.getTime() }` : undefined;
}

/**
 * The surface key of a post detail page, shared by the card that raises the
 * signal and the page that settles it.
 *
 * @param postId - The post the page shows.
 * @return The surface key.
 */
export function postSurface( postId: number ): string {
	return `post:${ postId }`;
}

/**
 * Holds one pending "the period is about to change" signal for the date
 * controls below, raised by a navigation that sets the range from elsewhere.
 *
 * @param props          - Provider props.
 * @param props.children - The surface's tree.
 * @return The provider.
 */
export function PeriodChangeSignalProvider( { children }: { children: ReactNode } ) {
	const [ signal, setSignal ] = useState< PeriodChangeSignal | null >( null );
	const nextId = useRef( 0 );

	const raise = useCallback( ( surface: string, range: Required< DateRange > ) => {
		nextId.current += 1;
		setSignal( {
			id: nextId.current,
			surface,
			rangeKey: `${ range.from.getTime() }:${ range.to.getTime() }`,
			raisedAt: Date.now(),
		} );
	}, [] );

	const settle = useCallback( ( id: number ) => {
		setSignal( current => ( current?.id === id ? null : current ) );
	}, [] );

	const value = useMemo( () => ( { signal, raise, settle } ), [ signal, raise, settle ] );

	return (
		<PeriodChangeSignalContext.Provider value={ value }>
			{ children }
		</PeriodChangeSignalContext.Provider>
	);
}

/**
 * Raise a signal before committing a navigation that applies `range` on
 * `surface`: a dashboard section slug, or a detail page's own key. The signal
 * is matched against the applied range by instant, so the navigation must
 * commit `range` exactly as given (`exactRange`), not the day-rounded form.
 *
 * @return The raise function.
 */
export function useRaisePeriodChange() {
	return useContext( PeriodChangeSignalContext ).raise;
}

/**
 * Settle the pending signal against this surface and own the attention it fires.
 *
 * Fires once surface, visible control and applied range all match; dropped once the
 * surface lands anywhere else. The id is let go after `PERIOD_CHANGE_ATTENTION_MS`, when
 * the control hides, or when the surface or range moves on, so it never replays.
 *
 * @param surface      - The surface's key, as passed to raise.
 * @param appliedRange - The range its date control shows.
 * @param isShown      - Whether the date control is on screen.
 * @return The id the control draws attention with, while it does.
 */
export function useSettlePeriodChange(
	surface: string,
	appliedRange: DateRange | undefined,
	isShown: boolean
): number | undefined {
	const { signal, settle } = useContext( PeriodChangeSignalContext );
	const [ attention, setAttention ] = useState< Attention >();
	const observed = useRef< string >();
	const appliedKey = rangeKey( appliedRange );
	const observation = `${ surface }|${ appliedKey ?? '' }`;

	useEffect( () => {
		const previous = observed.current;
		observed.current = observation;

		if ( ! signal ) {
			return;
		}

		if ( Date.now() - signal.raisedAt > PERIOD_CHANGE_SIGNAL_TTL_MS ) {
			settle( signal.id );
			return;
		}

		if ( signal.surface === surface && signal.rangeKey === appliedKey ) {
			if ( isShown ) {
				// Keep the object when the effect re-runs, so the timer below does not restart.
				setAttention( current =>
					current?.id === signal.id ? current : { id: signal.id, observation }
				);
				settle( signal.id );
			}
			return;
		}

		// The surface moved (or mounted) somewhere other than where the signal
		// said it would; an unchanged observation means it is still in flight.
		if ( previous !== observation ) {
			settle( signal.id );
		}
	}, [ signal, observation, surface, appliedKey, isShown, settle ] );

	useEffect( () => {
		if ( ! attention ) {
			return;
		}
		if ( ! isShown || attention.observation !== observation ) {
			setAttention( undefined );
			return;
		}
		const timer = setTimeout( () => {
			setAttention( current => ( current?.id === attention.id ? undefined : current ) );
		}, PERIOD_CHANGE_ATTENTION_MS );

		return () => clearTimeout( timer );
	}, [ attention, isShown, observation ] );

	return attention?.id;
}
