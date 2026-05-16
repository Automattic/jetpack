import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type DownloadState =
	| { phase: 'idle' }
	| { phase: 'submitting' }
	| { phase: 'progress'; percent: number }
	| { phase: 'success'; downloadUrl: string }
	| { phase: 'error'; message: string };

const SUBMIT_DELAY_MS = 500;
const PROGRESS_TICK_MS = 250;
const PROGRESS_STEPS = 12;
const ERROR_CHANCE = 0.1;

type Result = {
	state: DownloadState;
	submit: () => void;
	reset: () => void;
};

/**
 * Mocked Download state machine. Mirrors `useMockRestore` but the success
 * state surfaces a synthetic download URL the UI can render as a link.
 *
 * Calling `submit()` advances through `submitting → progress → success | error`
 * on synthetic timers; ~10% of submits land in the error branch. `reset()`
 * returns to `idle` and cancels any in-flight timers.
 *
 * @return The current state plus `submit` / `reset` callbacks.
 */
export function useMockDownload(): Result {
	const [ state, setState ] = useState< DownloadState >( { phase: 'idle' } );
	const timers = useRef< number[] >( [] );

	const clearTimers = useCallback( () => {
		timers.current.forEach( h => window.clearTimeout( h ) );
		timers.current = [];
	}, [] );

	useEffect( () => clearTimers, [ clearTimers ] );

	const reset = useCallback( () => {
		clearTimers();
		setState( { phase: 'idle' } );
	}, [ clearTimers ] );

	const submit = useCallback( () => {
		clearTimers();
		setState( { phase: 'submitting' } );
		const submittingHandle = window.setTimeout( () => {
			if ( Math.random() < ERROR_CHANCE ) {
				setState( {
					phase: 'error',
					message: __(
						'The download service returned an error. Try again in a moment.',
						'jetpack-backup-pkg'
					),
				} );
				return;
			}
			let step = 0;
			setState( { phase: 'progress', percent: 0 } );
			const tick = () => {
				step += 1;
				if ( step >= PROGRESS_STEPS ) {
					setState( { phase: 'success', downloadUrl: '#mock-download-url' } );
					return;
				}
				const percent = Math.round( ( step / PROGRESS_STEPS ) * 100 );
				setState( { phase: 'progress', percent } );
				const next = window.setTimeout( tick, PROGRESS_TICK_MS );
				timers.current.push( next );
			};
			const first = window.setTimeout( tick, PROGRESS_TICK_MS );
			timers.current.push( first );
		}, SUBMIT_DELAY_MS );
		timers.current.push( submittingHandle );
	}, [ clearTimers ] );

	return { state, submit, reset };
}
