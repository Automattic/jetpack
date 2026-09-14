/**
 * External dependencies
 */
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
 * dropped. Navigations here are synchronous, so this only has to outlive a
 * few renders; it keeps a click that went nowhere from firing on a later,
 * hand-picked visit to the same range.
 */
export const PERIOD_CHANGE_SIGNAL_TTL_MS = 5000;

type PeriodChangeRange = { from?: Date; to?: Date };

type PeriodChangeSignal = {
	id: number;
	surface: string;
	rangeKey: string;
	raisedAt: number;
};

type PeriodChangeSignalContextValue = {
	signal: PeriodChangeSignal | null;
	raise: ( surface: string, range: PeriodChangeRange ) => void;
	settle: ( id: number ) => void;
};

const INERT: PeriodChangeSignalContextValue = {
	signal: null,
	raise: () => {},
	settle: () => {},
};

const PeriodChangeSignalContext = createContext< PeriodChangeSignalContextValue >( INERT );

function rangeKey( range?: PeriodChangeRange ): string | undefined {
	return range?.from && range.to ? `${ range.from.getTime() }:${ range.to.getTime() }` : undefined;
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

	const raise = useCallback( ( surface: string, range: PeriodChangeRange ) => {
		const key = rangeKey( range );
		if ( ! key ) {
			return;
		}
		nextId.current += 1;
		setSignal( { id: nextId.current, surface, rangeKey: key, raisedAt: Date.now() } );
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
 * `surface`: a dashboard section slug, or a detail page's own key.
 *
 * @return The raise function.
 */
export function useRaisePeriodChange() {
	return useContext( PeriodChangeSignalContext ).raise;
}

export type PeriodChangeAttention = {
	/** The id of the signal that fired, held until the control ends it. */
	attentionId: number | undefined;
	endAttention: ( id: number ) => void;
};

/**
 * Settle the pending signal against what this surface shows. The signal
 * fires once the surface, a visible control and the applied range all match,
 * waits while a navigation is still landing, and is dropped as soon as the
 * surface moves anywhere else.
 *
 * @param surface      - The surface's key, as passed to raise.
 * @param appliedRange - The range its date control shows.
 * @param isShown      - Whether the date control is on screen.
 * @return The fired id and the callback the control ends it with.
 */
export function useSettlePeriodChange(
	surface: string,
	appliedRange: PeriodChangeRange | undefined,
	isShown: boolean
): PeriodChangeAttention {
	const { signal, settle } = useContext( PeriodChangeSignalContext );
	const [ attentionId, setAttentionId ] = useState< number >();
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
				setAttentionId( signal.id );
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

	const endAttention = useCallback( ( id: number ) => {
		setAttentionId( current => ( current === id ? undefined : current ) );
	}, [] );

	return { attentionId, endAttention };
}
