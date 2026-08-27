/**
 * Remembers which answer columns a form has already offered the user.
 *
 * `useView` persists the view itself, `fields` included, so which columns are shown is no
 * longer this file's business. What it cannot record is which columns were *on offer*
 * when the user made that choice, and without that a hidden column comes straight back:
 * the columns hook adds any answer column it has not seen before, and after a reload it
 * has seen none of them. Recording what was on offer lets it tell a column the user hid
 * from a field genuinely added to the form since.
 *
 * The record is kept per form. Answer columns are the form's own fields, so they mean
 * nothing on another form.
 *
 * It lives in the `@wordpress/preferences` store, next to the view it belongs to, so both
 * are written through the one persistence layer and cannot end up in different places.
 */
import { select, dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/** Namespaced so the key cannot collide with another feature's preferences. */
const PREFERENCES_SCOPE = 'jetpack/forms';

/*
 * Shape of the stored payload. Bumping this discards what is stored and starts over,
 * which costs the user one re-shown column — the only way a change to the shape can land
 * without stranding anyone holding an older record.
 */
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
 * Anything malformed or of an older shape is treated as no record at all, so a stale
 * entry re-offers every column rather than wedging the table.
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
