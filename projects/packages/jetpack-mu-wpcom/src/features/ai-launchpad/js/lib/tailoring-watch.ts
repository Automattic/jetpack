import { trackTailoringAbandoned, type TailoringStage } from './tracks.ts';

/** The slice of `window` the watcher listens on, injectable for tests. */
type PageEventTarget = Pick< EventTarget, 'addEventListener' | 'removeEventListener' >;

/**
 * How long after `beforeunload` a failure may still be blamed on the page leaving. Navigation can
 * cancel the page's requests as soon as it starts (Firefox does), while `pagehide` only fires once
 * the next page is ready to replace this one, so the wait has to cover a slow next page. A
 * `beforeunload` that led nowhere (a cancelled leave prompt, a download, a `mailto:` link) costs at
 * most this much delay, and only when an AI attempt fails inside the window.
 */
export const LEAVING_GRACE_MS = 10_000;

/** Options for watchTailoring(), injectable for tests. */
export interface TailoringWatchOptions {
	/** The clock; `performance.now`. */
	now?: () => number;
	/** See LEAVING_GRACE_MS. */
	graceMs?: number;
	/** Called when a page this run was abandoned on comes back from the back/forward cache. */
	onRestoredAfterAbandon?: () => void;
}

/** Controls for one watched tailoring run. */
export interface TailoringWatch {
	/** Move the run to its next stage, for the event a later page hide records. */
	setStage: ( stage: TailoringStage ) => void;
	/**
	 * Whether the page is on its way out: true once `pagehide` has fired, false when no
	 * `beforeunload` came first. In between it waits for `pagehide` (true) or for the grace period
	 * or a `pageshow` to show the page is staying (false).
	 */
	pageIsLeaving: () => Promise< boolean >;
	/** The run is being dropped because the page is leaving: nothing will be saved. */
	abandon: () => void;
	/** The run has settled: stop listening, so leaving afterwards records nothing. */
	settle: () => void;
}

/**
 * Watch a tailoring run for the user leaving the page before it settles.
 *
 * Tailoring takes several seconds, and the list is only saved at the very end. Two things follow
 * from that.
 *
 * On `pagehide` before `settle()`, this records `jetpack_ai_launchpad_tailoring_abandoned` once,
 * with the stage the run had reached and how long it had been going.
 *
 * Leaving also cancels the page's in-flight requests, which reach the client as ordinary failures.
 * Treated as such they would save the deterministic fallback as the user's list for good, so
 * `pageIsLeaving()` lets the caller tell the two apart and save nothing instead: the next visit
 * then shows the wizard again.
 *
 * @param aiSessionId - The id minted for this tailoring run, or '' when none was.
 * @param target      - Where the page lifecycle events fire; the window.
 * @param options     - See TailoringWatchOptions.
 * @return Controls for the run.
 */
export function watchTailoring(
	aiSessionId: string,
	target: PageEventTarget = window,
	options: TailoringWatchOptions = {}
): TailoringWatch {
	const {
		now = () => performance.now(),
		graceMs = LEAVING_GRACE_MS,
		onRestoredAfterAbandon = () => window.location.reload(),
	} = options;
	const start = now();
	let stage: TailoringStage = 'ai';
	let settled = false;
	let recorded = false;
	let abandoned = false;
	let hidden = false;
	// When the last `beforeunload` fired, or null when none is pending.
	let leavingSince: number | null = null;
	let waiters: Array< ( leaving: boolean ) => void > = [];
	let graceTimer: ReturnType< typeof setTimeout > | undefined;

	/**
	 * Answer every pending pageIsLeaving() call.
	 *
	 * @param leaving - The answer.
	 */
	const answer = ( leaving: boolean ) => {
		clearTimeout( graceTimer );
		graceTimer = undefined;
		const pending = waiters;
		waiters = [];
		pending.forEach( resolve => resolve( leaving ) );
	};

	const onBeforeUnload = () => {
		leavingSince = now();
	};

	const onPageHide = () => {
		hidden = true;
		answer( true );
		if ( settled || recorded ) {
			return;
		}
		recorded = true;
		try {
			trackTailoringAbandoned( {
				stage,
				elapsed_ms: Math.max( 0, Math.round( now() - start ) ),
				ai_session_id: '' !== aiSessionId ? aiSessionId : 'none',
			} );
		} catch {
			// Telemetry only.
		}
	};

	const onPageShow = ( event: Event ) => {
		// The page is staying, or has come back from the back/forward cache.
		hidden = false;
		leavingSince = null;
		answer( false );
		if ( abandoned && ( event as PageTransitionEvent ).persisted ) {
			// The abandoned run left this page waiting on a list that will never come. Reloading
			// shows the wizard again, since nothing was saved.
			onRestoredAfterAbandon();
		}
	};

	target.addEventListener( 'beforeunload', onBeforeUnload );
	target.addEventListener( 'pagehide', onPageHide );
	target.addEventListener( 'pageshow', onPageShow );

	return {
		setStage: next => {
			stage = next;
		},
		pageIsLeaving: () => {
			if ( hidden ) {
				return Promise.resolve( true );
			}
			if ( null === leavingSince ) {
				return Promise.resolve( false );
			}
			const remaining = leavingSince + graceMs - now();
			if ( remaining <= 0 ) {
				// The page outlived the grace period: that `beforeunload` led nowhere.
				leavingSince = null;
				return Promise.resolve( false );
			}
			return new Promise( resolve => {
				waiters.push( resolve );
				if ( undefined === graceTimer ) {
					graceTimer = setTimeout( () => {
						leavingSince = null;
						answer( false );
					}, remaining );
				}
			} );
		},
		abandon: () => {
			abandoned = true;
		},
		settle: () => {
			settled = true;
			answer( false );
			target.removeEventListener( 'beforeunload', onBeforeUnload );
			target.removeEventListener( 'pagehide', onPageHide );
			target.removeEventListener( 'pageshow', onPageShow );
		},
	};
}
