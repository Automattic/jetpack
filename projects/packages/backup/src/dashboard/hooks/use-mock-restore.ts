import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { RestoreState } from '../types/restore';

const SUBMIT_DELAY_MS = 500;
const PROGRESS_TICK_MS = 250;
const PROGRESS_STEPS = 12;
const ERROR_CHANCE = 0.1;

type Result = {
	state: RestoreState;
	submit: () => void;
	reset: () => void;
};

/**
 * Mocked Restore state machine.
 *
 * Calling `submit()` advances through `submitting → progress → success | error`
 * on synthetic timers; ~10% of submits land in the error branch so the
 * error UI is reachable without code changes. `reset()` returns to `idle`.
 *
 * @return The current state plus `submit` / `reset` callbacks.
 */
export function useMockRestore(): Result {
	const [ state, setState ] = useState< RestoreState >( { phase: 'idle' } );
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
						'The backup service returned an error. Wait a moment and try again.',
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
					setState( { phase: 'success' } );
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
