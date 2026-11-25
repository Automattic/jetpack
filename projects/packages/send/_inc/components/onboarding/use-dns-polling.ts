import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { errorMessage, fetchDnsLookup, fetchStatus, postAction } from '../../data/api';
import { sendStore } from '../../data/store';
import type { DnsLookup, SendStatus } from '../../data/types';

export type DnsPollingOptions = {
	/** Poll only while true (the setup page or the card is on screen). */
	enabled: boolean;
	/** `setup` backs off from 15 s and gives up after 30 minutes; `overview` checks every 60 s. */
	mode: 'setup' | 'overview';
};

export type DnsPollingState = {
	lookup: DnsLookup | null;
	/** A lookup or mail-service check is in flight. */
	checking: boolean;
	lastCheckedAt: Date | null;
	/** Polling gave up after 30 minutes in the tab; show "Check now". */
	stopped: boolean;
	error: string | null;
	/** Check right away and reset the backoff. */
	checkNow: () => void;
	/** Go back to fast polling, e.g. after a Copy click. */
	nudge: () => void;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** Setup backoff: each phase's delay applies until that much polling time has passed. */
const SETUP_SCHEDULE = [
	{ until: 2 * MINUTE, delay: 15 * SECOND },
	{ until: 10 * MINUTE, delay: 30 * SECOND },
	{ until: 30 * MINUTE, delay: 60 * SECOND },
];

export const OVERVIEW_DELAY = 60 * SECOND;

/** Ask the mail service at least this often, even when the local lookup sees nothing. */
export const MAIL_CHECK_EVERY = 5 * MINUTE;

/** The server throttles POST /check-dns to once a minute, so don't ask more often. */
export const MAIL_CHECK_GAP = MINUTE;

/**
 * Delay before the next lookup.
 *
 * @param mode    - Polling mode.
 * @param elapsed - Polling time since the last reset, in ms (hidden-tab time doesn't count).
 * @return Delay in ms, or null to stop.
 */
export function nextDelay( mode: DnsPollingOptions[ 'mode' ], elapsed: number ): number | null {
	if ( mode === 'overview' ) {
		return OVERVIEW_DELAY;
	}
	const phase = SETUP_SCHEDULE.find( ( { until } ) => elapsed < until );
	return phase ? phase.delay : null;
}

/**
 * Poll GET /dns-lookup with backoff, pausing while the tab is hidden. When every record is found
 * (and every 5 minutes regardless) it calls POST /check-dns and stores the returned status. When the
 * lookup says the domain verified some other way, it re-reads GET /status into the store.
 *
 * @param options         - Polling options.
 * @param options.enabled - Poll only while true.
 * @param options.mode    - `setup` or `overview` schedule.
 * @return The latest lookup and controls.
 */
export function useDnsPolling( { enabled, mode }: DnsPollingOptions ): DnsPollingState {
	const { receiveStatus } = useDispatch( sendStore );
	const [ lookup, setLookup ] = useState< DnsLookup | null >( null );
	const [ checking, setChecking ] = useState( false );
	const [ lastCheckedAt, setLastCheckedAt ] = useState< Date | null >( null );
	const [ stopped, setStopped ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	// Mutable loop state. `run` changes on every enable/disable so stale requests can't reschedule.
	const loop = useRef( {
		run: 0,
		timer: null as ReturnType< typeof setTimeout > | null,
		inFlight: false,
		elapsed: 0,
		startedAt: 0,
		mailCheckedAt: null as number | null,
		lookup: null as DnsLookup | null,
		// `can_enable` from the last status this hook stored; null until it has stored one.
		statusCanEnable: null as boolean | null,
	} );
	const config = useRef( { enabled, mode, receiveStatus } );
	config.current = { enabled, mode, receiveStatus };

	const clearTimer = useCallback( () => {
		if ( loop.current.timer ) {
			clearTimeout( loop.current.timer );
			loop.current.timer = null;
		}
	}, [] );

	const tickRef = useRef< () => Promise< void > >( async () => undefined );

	const schedule = useCallback( () => {
		const state = loop.current;
		clearTimer();
		if ( ! config.current.enabled || document.hidden ) {
			return;
		}
		// The setup page has nothing left to wait for once the domain verifies and the store knows it.
		if (
			config.current.mode === 'setup' &&
			state.lookup?.can_enable &&
			state.statusCanEnable === true
		) {
			return;
		}
		const delay = nextDelay( config.current.mode, state.elapsed );
		if ( delay === null ) {
			setStopped( true );
			return;
		}
		state.timer = setTimeout( () => {
			state.timer = null;
			state.elapsed += delay;
			tickRef.current();
		}, delay );
	}, [ clearTimer ] );

	tickRef.current = async () => {
		const state = loop.current;
		if ( state.inFlight ) {
			return;
		}
		const run = state.run;
		state.inFlight = true;
		setChecking( true );
		try {
			let next = await fetchDnsLookup();
			if ( run !== state.run ) {
				return;
			}
			const now = Date.now();
			const sinceMail = now - ( state.mailCheckedAt ?? state.startedAt );
			// Ask when every record shows up, and every 5 minutes regardless, so a resolver caching
			// "not found" can't stall it and records that break after passing get noticed.
			const askMailService =
				( ! next.can_enable &&
					next.all_found &&
					( state.mailCheckedAt === null || now - state.mailCheckedAt >= MAIL_CHECK_GAP ) ) ||
				sinceMail >= MAIL_CHECK_EVERY;
			let status: SendStatus | null = null;
			if ( askMailService ) {
				state.mailCheckedAt = now;
				try {
					status = await postAction( 'check-dns' );
				} catch {
					// The local lookup still answered; the mail service is asked again later.
				}
			} else if ( next.can_enable && state.statusCanEnable !== true ) {
				// The server verified the domain some other way (the background watch, another tab),
				// so refresh the stored status before the page reads it.
				try {
					status = await fetchStatus();
				} catch {
					// Tried again on the next lookup.
				}
			}
			if ( run !== state.run ) {
				return;
			}
			if ( status ) {
				config.current.receiveStatus( status );
				state.statusCanEnable = status.can_enable;
				// The lookup's verdicts come from the stored check, so re-read it when they disagree.
				if ( status.can_enable !== next.can_enable ) {
					next = await fetchDnsLookup();
					if ( run !== state.run ) {
						return;
					}
				}
			}
			state.lookup = next;
			setLookup( next );
			setError( null );
		} catch ( e ) {
			if ( run !== state.run ) {
				return;
			}
			setError( errorMessage( e ) );
		} finally {
			if ( run === state.run ) {
				state.inFlight = false;
				setChecking( false );
				setLastCheckedAt( new Date() );
				schedule();
			}
		}
	};

	const restart = useCallback( () => {
		const state = loop.current;
		state.elapsed = 0;
		setStopped( false );
		clearTimer();
		if ( ! state.inFlight ) {
			tickRef.current();
		}
	}, [ clearTimer ] );

	useEffect( () => {
		const state = loop.current;
		state.run += 1;
		state.inFlight = false;
		clearTimer();
		if ( ! enabled ) {
			setChecking( false );
			return;
		}
		state.elapsed = 0;
		state.startedAt = Date.now();
		state.mailCheckedAt = null;
		state.statusCanEnable = null;
		setStopped( false );
		if ( ! document.hidden ) {
			tickRef.current();
		}

		const onVisibility = () => {
			if ( document.hidden ) {
				clearTimer();
			} else if ( ! state.inFlight && ! state.timer ) {
				// Check once on return, then carry on with the schedule.
				tickRef.current();
			}
		};
		document.addEventListener( 'visibilitychange', onVisibility );
		return () => {
			document.removeEventListener( 'visibilitychange', onVisibility );
			state.run += 1;
			state.inFlight = false;
			clearTimer();
		};
	}, [ enabled, mode, clearTimer ] );

	const nudge = useCallback( () => {
		const state = loop.current;
		state.elapsed = 0;
		setStopped( false );
		if ( ! state.inFlight ) {
			schedule();
		}
	}, [ schedule ] );

	return {
		lookup,
		checking,
		lastCheckedAt,
		stopped,
		error,
		checkNow: restart,
		nudge,
	};
}
