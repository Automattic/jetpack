import { useCallback, useRef } from 'react';
import { clampStep, TOTAL_STEPS } from './lib';
import type { WizardState, WizardStep } from './lib';
import type { SetupModuleResult } from './use-setup-modules';

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
	// What the apply did, kept so a reload on the finish step reports it again.
	results?: SetupModuleResult[];
};

/**
 * Whether a stored value is a list of apply results this wizard wrote.
 *
 * @param value - Whatever was in storage.
 * @return True for a non-empty, well-formed list.
 */
function isResults( value: unknown ): value is SetupModuleResult[] {
	return (
		Array.isArray( value ) &&
		value.length > 0 &&
		value.every(
			row =>
				typeof row?.slug === 'string' &&
				typeof row?.name === 'string' &&
				typeof row?.wanted === 'boolean' &&
				typeof row?.ok === 'boolean' &&
				typeof row?.changed === 'boolean'
		)
	);
}

/**
 * What was read back at the start of this page load, if anything.
 *
 * Session storage, not local: the run belongs to this visit, and the connection
 * round trip is inside one session either way.
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

		// The finish step only comes back with the results it reports; without them it
		// would compare against a site that already matches and say nothing changed.
		const results = isResults( parsed.results ) ? parsed.results : undefined;
		const lastStep = results ? TOTAL_STEPS - 1 : TOTAL_STEPS - 2;
		const step = clampStep( Math.min( parsed.step, lastStep ) );

		return {
			step,
			furthestStep: clampStep( Math.min( Math.max( parsed.furthestStep, step ), lastStep ) ),
			choices: parsed.choices ?? {},
			freeText: typeof parsed.freeText === 'string' ? parsed.freeText : '',
			wanted: parsed.wanted ?? {},
			results,
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
	// A ref, so a save racing the clear in the same render still sees it.
	const done = useRef( false );

	const save = useCallback( ( run: SavedRun ) => {
		if ( done.current ) {
			return;
		}

		try {
			window.sessionStorage.setItem( KEY, JSON.stringify( run ) );
		} catch {
			// Nothing to do: the flow works without it.
		}
	}, [] );

	// Called when the wizard is left for good, so the next visit is not handed a
	// finished run to resume.
	const forget = useCallback( () => {
		done.current = true;

		try {
			window.sessionStorage.removeItem( KEY );
		} catch {
			// As above.
		}
	}, [] );

	return { save, forget };
}
