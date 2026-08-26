/**
 * Remembers which columns a user chose on the responses table.
 *
 * DataViews reports a column being shown, hidden or moved, but has nowhere to keep that:
 * the view is component state, so a refresh puts every column back where it started and
 * silently discards the choice.
 *
 * The choice is stored per form. Answer columns are the form's own fields, so they mean
 * nothing on another form, and one shared list would either strand a form's columns on
 * its neighbour or fight the per-form reset the columns hook already does.
 *
 * `localStorage` rather than user meta: this is a per-browser convenience, and the
 * dashboard has no preferences store to hang it on. Every access is wrapped, because
 * reading it is not merely unreliable but throwing — a private window, a browser set to
 * block site data, or a full quota all raise rather than return empty. A forgotten column
 * layout must never take the dashboard down with it.
 */

/** Namespaced so the key cannot collide with anything else on the admin origin. */
const STORAGE_PREFIX = 'jetpack-forms/response-columns/';

export type ResponseColumnPreference = {
	/** The view's `fields`: which columns are shown, in the order the user put them. */
	fields: string[];
	/**
	 * Every answer column that existed when the choice was saved.
	 *
	 * Without this, a hidden column would come straight back: the columns hook adds any
	 * answer column it has not seen before, and after a refresh it has seen none of them.
	 * Recording what was on offer at the time lets it tell a column the user hid from a
	 * field that has genuinely been added to the form since.
	 */
	knownAnswerIds: string[];
};

/**
 * The storage key for a form's column choice.
 *
 * @param formId - The form on screen, or null on the view spanning every form.
 * @return         The storage key.
 */
export const getColumnPreferenceKey = ( formId: number | null ): string =>
	`${ STORAGE_PREFIX }${ formId ?? 'all' }`;

/**
 * Reads a form's stored column choice.
 *
 * Anything unreadable, malformed or of the wrong shape is treated as no choice at all, so
 * a stale or hand-edited entry falls back to the defaults rather than rendering a broken
 * table.
 *
 * @param formId - The form on screen, or null on the view spanning every form.
 * @return         The stored choice, or null when there is none to restore.
 */
export const readColumnPreference = ( formId: number | null ): ResponseColumnPreference | null => {
	try {
		const raw = window.localStorage.getItem( getColumnPreferenceKey( formId ) );

		if ( ! raw ) {
			return null;
		}

		const parsed = JSON.parse( raw );

		if ( ! parsed || ! Array.isArray( parsed.fields ) ) {
			return null;
		}

		const fields = parsed.fields.filter( ( id: unknown ) => typeof id === 'string' );
		const knownAnswerIds = Array.isArray( parsed.knownAnswerIds )
			? parsed.knownAnswerIds.filter( ( id: unknown ) => typeof id === 'string' )
			: [];

		return { fields, knownAnswerIds };
	} catch {
		return null;
	}
};

/**
 * Stores a form's column choice.
 *
 * @param formId     - The form on screen, or null on the view spanning every form.
 * @param preference - The choice to store.
 */
export const writeColumnPreference = (
	formId: number | null,
	preference: ResponseColumnPreference
): void => {
	try {
		window.localStorage.setItem( getColumnPreferenceKey( formId ), JSON.stringify( preference ) );
	} catch {
		// A choice of columns is not worth an error path. If it cannot be stored the
		// table still works; it simply starts from the defaults next time.
	}
};
