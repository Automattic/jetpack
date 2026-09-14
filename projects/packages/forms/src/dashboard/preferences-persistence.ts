/**
 * Gives the Forms dashboard's `@wordpress/preferences` store somewhere to persist to.
 *
 * Without this the store keeps the view in memory only: a wp-build dashboard is not booted
 * by Core, and `@wordpress/boot` registers no layer, so nothing survives a reload.
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/** The shape the preferences store hands us: its entire payload, scopes and all. */
type PersistenceData = Record< string, unknown >;

/**
 * Builds a storage key scoped to the current site and user, so two accounts sharing a
 * browser — or one account across two sites — don't inherit each other's views.
 *
 * @return The per-site, per-user storage key.
 */
const getStorageKey = (): string => {
	const data = getScriptData();
	// `blog_id` is 0 on a disconnected site, so `??` would read that 0 as a real id and
	// collapse every disconnected site in this browser onto one key. Only a positive id
	// is an id; otherwise fall back to the host so sites stay apart.
	const blogId = data?.site?.wpcom?.blog_id;
	const scope = typeof blogId === 'number' && blogId > 0 ? blogId : data?.site?.host ?? 'site';
	const userId = data?.user?.current_user?.id ?? 'user';

	return `jetpack-forms-preferences-${ scope }-${ userId }`;
};

/**
 * Reads the stored payload.
 *
 * Wrapped because `localStorage` throws rather than returning empty in a private window or
 * when site data is blocked, and a remembered view must never take the dashboard down.
 *
 * @return The stored payload, or an empty one when there is nothing to restore.
 */
const readStoredData = (): PersistenceData => {
	try {
		const raw = window.localStorage.getItem( getStorageKey() );

		return raw ? JSON.parse( raw ) : {};
	} catch {
		return {};
	}
};

let persistenceLayerRegistered = false;

/**
 * Registers the persistence layer on the preferences store.
 *
 * Idempotent: both dashboard implementations mount this, and a second registration would
 * re-hydrate over unsaved state.
 *
 * @param registerLayer - The preferences store's `setPersistenceLayer` action.
 */
export const ensurePreferencesPersistence = (
	registerLayer: ( layer: {
		get: () => Promise< PersistenceData >;
		set: ( value: PersistenceData ) => void;
	} ) => void
): void => {
	if ( persistenceLayerRegistered ) {
		return;
	}

	persistenceLayerRegistered = true;

	const storageKey = getStorageKey();

	registerLayer( {
		get: async () => readStoredData(),
		set: ( value: PersistenceData ) => {
			try {
				window.localStorage.setItem( storageKey, JSON.stringify( value ) );
			} catch {
				// Storage may be unavailable or full. The view still works for this
				// session; it simply starts from the defaults next time.
			}
		},
	} );
};
