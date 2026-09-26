import { useCallback, useState } from 'react';
import type { WizardState, WizardStep } from './lib';

const KEY = 'jetpack-onboarding-run';

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
 * Session storage, not local: the run belongs to this visit. Coming back to
 * wp-admin next week to a half-finished wizard would be worse than starting it
 * again, and the connection round trip is inside one session either way.
 *
 * What became of the modules is deliberately not kept. It is the outcome of a
 * request this page load never made, and showing it again would be reporting
 * work that did not happen here.
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

		// Anything hand-edited or left by an older shape is thrown away rather than
		// trusted: a bad step index would land the wizard on a screen that is not there.
		if ( typeof parsed.step !== 'number' || typeof parsed.furthestStep !== 'number' ) {
			return null;
		}

		return {
			step: parsed.step as WizardStep,
			furthestStep: parsed.furthestStep as WizardStep,
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
