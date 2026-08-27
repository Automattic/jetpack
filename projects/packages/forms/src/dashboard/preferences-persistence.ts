/**
 * Gives the Forms dashboard's `@wordpress/preferences` store somewhere to persist to.
 *
 * `useView` from `@wordpress/views` keeps a DataViews view in the preferences store, but
 * the store only holds it in memory: persisting is the host's job, and the host wires a
 * layer up during boot. wp-admin does that for the block editor; a wp-build dashboard is
 * not booted by Core and `@wordpress/boot` registers nothing, so without this the view
 * resolves from the defaults again on every reload and no preference ever survives.
 *
 * `localStorage` rather than user meta: a view is a per-browser convenience, and writing
 * it to user meta would mean a REST round trip on every column drag. The layer is the
 * only thing that would have to change to move it server-side later.
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
 * Every access is wrapped: reading `localStorage` is not merely unreliable but throwing —
 * a private window, a browser set to block site data, or a full quota all raise rather
 * than return empty. A remembered column layout must never take the dashboard down.
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
 * The store calls `get()` once on registration to hydrate itself, then `set()` with its
 * whole payload on every change. Idempotent, because both dashboard implementations mount
 * this and a second registration would re-hydrate over unsaved state.
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
