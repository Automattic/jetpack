import { useCallback, useState } from 'react';
import { TOTAL_STEPS } from './lib';
import type { WizardState, WizardStep } from './lib';

const KEY = 'jetpack-onboarding-run';

/**
 * Whether a stored value names a step this wizard has.
 *
 * @param value - Whatever was in storage.
 * @return True for a whole number inside the range.
 */
function isStep( value: unknown ): value is number {
	return Number.isInteger( value ) && ( value as number ) >= 0 && ( value as number ) < TOTAL_STEPS;
}

export type SavedRun = {
	step: WizardStep;
	furthestStep: WizardStep;
	choices: WizardState[ 'choices' ];
	freeText: string;
	wanted: Record< string, boolean >;
};

/**
 * What was read back at the start of this page load, if anything.
 *
 * Session storage, not local: the run belongs to this visit, and the connection
 * round trip is inside one session either way. What became of the modules is
 * deliberately not kept — it is the outcome of a request this page never made.
 *
 * @return The saved run, or null when there is nothing to restore.
 */
export function readSavedRun(): SavedRun | null {
	try {
		const held = window.sessionStorage.getItem( KEY );

		if ( ! held ) {
			return null;
		}

		const parsed = JSON.parse( held ) as Partial< SavedRun >;

		/*
		 * Anything hand-edited or left by an older shape is thrown away rather than
		 * trusted. A step has to be a whole number of an actual step: a 99, a -1, a
		 * 1.5 or an Infinity all index past the end of the array, and the wizard
		 * reads `.kind` off whatever it finds there and renders nothing at all —
		 * for every load in that session, because the bad value is still stored.
		 */
		if ( ! isStep( parsed.step ) || ! isStep( parsed.furthestStep ) ) {
			return null;
		}

		/*
		 * Never onto the finish step. It reports what an apply did, and after a
		 * reload there is no apply to report: restoring it would state that nothing
		 * changed on a site where something just had.
		 */
		const step = Math.min( parsed.step, TOTAL_STEPS - 2 ) as WizardStep;

		return {
			step,
			furthestStep: Math.max( parsed.furthestStep, step ) as WizardStep,
			choices: parsed.choices ?? {},
			freeText: typeof parsed.freeText === 'string' ? parsed.freeText : '',
			wanted: parsed.wanted ?? {},
		};
	} catch {
		// Private browsing, blocked site data, and anything unparseable. A run that
		// cannot be restored starts again, which is what happened before this existed.
		return null;
	}
}

/**
 * Keeps this run where a reload can find it.
 *
 * @return A writer, and a way to throw the run away once it is over.
 */
export function useSavedRun() {
	// Held so a save and a clear in the same render cannot race to the wrong order.
	const [ done, setDone ] = useState( false );

	const save = useCallback(
		( run: SavedRun ) => {
			if ( done ) {
				return;
			}

			try {
				window.sessionStorage.setItem( KEY, JSON.stringify( run ) );
			} catch {
				// Nothing to do: the flow works without it.
			}
		},
		[ done ]
	);

	// Called when the wizard is left for good, so the next visit is not handed a
	// finished run to resume.
	const forget = useCallback( () => {
		setDone( true );

		try {
			window.sessionStorage.removeItem( KEY );
		} catch {
			// As above.
		}
	}, [] );

	return { save, forget };
}
