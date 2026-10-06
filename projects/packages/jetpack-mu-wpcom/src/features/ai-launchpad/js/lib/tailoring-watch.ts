import { trackTailoringAbandoned, type TailoringStage } from './tracks.ts';

/** The slice of `window` the watcher listens on, injectable for tests. */
type PageHideTarget = Pick< EventTarget, 'addEventListener' | 'removeEventListener' >;

/** Controls for one watched tailoring run. */
export interface TailoringWatch {
	/** Move the run to its next stage, for the event a later page hide records. */
	setStage: ( stage: TailoringStage ) => void;
	/** The run has settled: stop listening, so leaving afterwards records nothing. */
	settle: () => void;
}

/**
 * Watch a tailoring run for the user leaving the page before it settles.
 *
 * Tailoring takes several seconds, and the list is only saved at the very end, so a user who leaves
 * in between (e.g. straight to the block editor) comes back to the wizard with nothing to show for
 * it. On `pagehide` before `settle()`, this records `jetpack_ai_launchpad_tailoring_abandoned` once,
 * with the stage the run had reached and how long it had been going.
 *
 * @param aiSessionId - The id minted for this tailoring run, or '' when none was.
 * @param target      - Where `pagehide` fires; the window.
 * @param now         - The clock; `performance.now`.
 * @return Controls for the run.
 */
export function watchTailoring(
	aiSessionId: string,
	target: PageHideTarget = window,
	now: () => number = () => performance.now()
): TailoringWatch {
	const start = now();
	let stage: TailoringStage = 'ai';
	let done = false;

	const stop = () => {
		done = true;
		target.removeEventListener( 'pagehide', onPageHide );
	};

	/** Record the abandonment, at most once per run. */
	function onPageHide(): void {
		if ( done ) {
			return;
		}
		stop();
		try {
			trackTailoringAbandoned( {
				stage,
				elapsed_ms: Math.max( 0, Math.round( now() - start ) ),
				ai_session_id: '' !== aiSessionId ? aiSessionId : 'none',
			} );
		} catch {
			// Telemetry only.
		}
	}

	target.addEventListener( 'pagehide', onPageHide );

	return {
		setStage: next => {
			stage = next;
		},
		settle: stop,
	};
}
