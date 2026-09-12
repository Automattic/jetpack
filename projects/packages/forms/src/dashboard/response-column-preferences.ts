/**
 * Remembers which answer columns a form has already offered the user.
 *
 * `useView` persists which columns are shown; this records which were on offer at the time,
 * without which the columns hook re-adds — and so un-hides — every one of them on reload.
 */
import { select, dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/** Namespaced so the key cannot collide with another feature's preferences. */
const PREFERENCES_SCOPE = 'jetpack/forms';

// Bumping this discards what is stored, costing one re-shown column. It is the only way a
// change to the shape lands without stranding anyone holding an older record.
const SCHEMA_VERSION = 2;

type StoredKnownAnswerIds = {
	v: number;
	knownAnswerIds: string[];
};

/**
 * The preference key for a form's record.
 *
 * @param formId - The form on screen, or null on the view spanning every form.
 * @return         The preference key.
 */
export const getColumnPreferenceKey = ( formId: number | null ): string =>
	`response-columns/${ formId ?? 'all' }`;

/**
 * Reads the answer columns a form had already offered when its view was last changed.
 *
 * A malformed or older-shaped record reads as none at all, so a stale entry re-offers every
 * column rather than wedging the table.
 *
 * @param formId - The form on screen, or null on the view spanning every form.
 * @return         The columns already offered, or null when there is no record.
 */
export const readKnownAnswerIds = ( formId: number | null ): string[] | null => {
	const stored = select( preferencesStore ).get(
		PREFERENCES_SCOPE,
		getColumnPreferenceKey( formId )
	) as StoredKnownAnswerIds | undefined;

	if ( ! stored || stored.v !== SCHEMA_VERSION || ! Array.isArray( stored.knownAnswerIds ) ) {
		return null;
	}

	return stored.knownAnswerIds.filter( ( id: unknown ) => typeof id === 'string' );
};

/**
 * Records the answer columns a form has offered.
 *
 * @param formId         - The form on screen, or null on the view spanning every form.
 * @param knownAnswerIds - Every answer column on offer at the time.
 */
export const writeKnownAnswerIds = ( formId: number | null, knownAnswerIds: string[] ): void => {
	dispatch( preferencesStore ).set( PREFERENCES_SCOPE, getColumnPreferenceKey( formId ), {
		v: SCHEMA_VERSION,
		knownAnswerIds,
	} );
};
