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
 * How long a signal may wait for its surface or date control to show before it is
 * dropped. Keeps a click that went nowhere from firing on a later visit.
 */
export const PERIOD_CHANGE_SIGNAL_TTL_MS = 5000;

/**
 * How long a date control draws attention to a period set from elsewhere.
 * The control's fade reads this too, so the fill and the id end together.
 */
export const PERIOD_CHANGE_ATTENTION_MS = 1600;

/** A period a widget set: the id restarts the cue, the range is what it announces. */
export type PeriodChange = {
	id: number;
	range: Required< DateRange >;
};

type PeriodChangeSignal = PeriodChange & {
	surface: string;
	raisedAt: number;
};

type Attention = PeriodChange & {
	/** The surface it fired on; it is let go once the surface moves. */
	surface: string;
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
 * The surface key of a post detail page, so a signal raised on one post never fires on another.
 *
 * @param postId - The post the page shows.
 * @return The surface key.
 */
export function postSurface( postId: number ): string {
	return `post:${ postId }`;
}

/**
 * Holds one pending "a widget set the period" signal for the date controls below.
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
		setSignal( { id: nextId.current, surface, range, raisedAt: Date.now() } );
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
 * Raise a signal that a widget set `range` on `surface`: a dashboard section slug, or a
 * detail page's own key. The navigation must commit `range` exactly as given
 * (`exactRange`): the cue is let go once the applied range differs from it.
 *
 * @return The raise function.
 */
export function useRaisePeriodChange() {
	return useContext( PeriodChangeSignalContext ).raise;
}

/**
 * Fire the pending signal once it names this surface and the control shows, and own the
 * attention it draws: let go after `PERIOD_CHANGE_ATTENTION_MS`, when the control hides, when
 * the surface moves on, or when the reader moves the range elsewhere, so it never replays.
 *
 * @param surface      - The surface's key, as passed to raise.
 * @param appliedRange - The range its date control shows.
 * @param isShown      - Whether the date control is on screen.
 * @return The period change the control draws attention to, while it does.
 */
export function useSettlePeriodChange(
	surface: string,
	appliedRange: DateRange | undefined,
	isShown: boolean
): PeriodChange | undefined {
	const { signal, settle } = useContext( PeriodChangeSignalContext );
	const [ attention, setAttention ] = useState< Attention >();
	const settledSurface = useRef( surface );
	const appliedKey = rangeKey( appliedRange );
	const lastAppliedKey = useRef( appliedKey );

	useEffect( () => {
		const surfaceMoved = settledSurface.current !== surface;
		settledSurface.current = surface;

		if ( ! signal ) {
			return;
		}

		if ( Date.now() - signal.raisedAt > PERIOD_CHANGE_SIGNAL_TTL_MS ) {
			settle( signal.id );
			return;
		}

		if ( signal.surface === surface ) {
			if ( isShown ) {
				// Strict Mode runs this effect twice on mount; keep the object so the timer below does not restart.
				setAttention( current =>
					current?.id === signal.id ? current : { id: signal.id, range: signal.range, surface }
				);
				settle( signal.id );
			}
			return;
		}

		// A signal for another surface waits while this one stays put, and is dropped once it moves.
		if ( surfaceMoved ) {
			settle( signal.id );
		}
	}, [ signal, surface, isShown, settle ] );

	useEffect( () => {
		if ( ! attention ) {
			return;
		}
		if ( ! isShown || attention.surface !== surface ) {
			setAttention( undefined );
			return;
		}
		const timer = setTimeout( () => {
			setAttention( current => ( current?.id === attention.id ? undefined : current ) );
		}, PERIOD_CHANGE_ATTENTION_MS );

		return () => clearTimeout( timer );
	}, [ attention, isShown, surface ] );

	// The cue fires before the navigation lands, so only a move to a range other than its own lets it go.
	useEffect( () => {
		const rangeMoved = lastAppliedKey.current !== appliedKey;
		lastAppliedKey.current = appliedKey;

		if ( rangeMoved && attention && appliedKey !== rangeKey( attention.range ) ) {
			setAttention( undefined );
		}
	}, [ appliedKey, attention ] );

	return useMemo( () => attention && { id: attention.id, range: attention.range }, [ attention ] );
}
