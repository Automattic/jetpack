import { getScriptData } from '@automattic/jetpack-script-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { libraryFields } from '../components/library/fields';
import type { View } from '@wordpress/dataviews';

/**
 * Persists the Library DataViews `view` per-user, the way Core's media
 * library persists its own view settings.
 *
 * We lean on the `@wordpress/preferences` store so the dashboard speaks the
 * same API Core uses. The standalone VideoPress dashboard isn't booted by
 * Core, though, so the preferences store has no persistence layer wired up
 * out of the box. We register a localStorage-backed layer (keyed per site +
 * user) so values survive a reload without standing up a user-meta REST
 * round-trip for what is purely a presentational preference.
 *
 * Only a whitelist of fields is persisted (type, visible fields, layout,
 * sort, perPage). `search` is never persisted and `page` always resets to 1
 * so a reload lands the user on a predictable first page. Persisted values
 * are validated against the known field set on hydrate, so a future schema
 * change (e.g. a renamed/removed field) can't wedge the screen — we fall
 * back to the supplied default view instead.
 */

const PREFERENCES_SCOPE = 'jetpack/videopress';
const PREFERENCES_NAME = 'libraryView';

// Shape we actually persist. A deliberately small subset of `View`.
type PersistedView = Pick< View, 'fields' | 'sort' | 'perPage' > & {
	type?: View[ 'type' ];
	layout?: View[ 'layout' ];
};

type PersistenceData = Record< string, unknown >;

const KNOWN_FIELD_IDS = new Set( libraryFields.map( field => field.id ) );
const VALID_TYPES = new Set< View[ 'type' ] >( [ 'grid', 'table' ] );
const VALID_DENSITIES = new Set( [ 'compact', 'comfortable', 'balanced' ] );
const VALID_SORT_DIRECTIONS = new Set( [ 'asc', 'desc' ] );

/**
 * Build a storage key scoped to the current site + user so two accounts on
 * the same browser (or the same account across sites) don't share a view.
 *
 * @return The per-site/per-user localStorage key.
 */
function getStorageKey(): string {
	const data = getScriptData();
	// `blog_id` defaults to 0 for disconnected sites (see assets Script_Data),
	// and `??` would treat that 0 as a real id — collapsing every disconnected
	// site in the same browser onto one shared key. Only trust a positive id;
	// otherwise fall back to the host so different sites stay separate.
	const blogId = data?.site?.wpcom?.blog_id;
	const scope = typeof blogId === 'number' && blogId > 0 ? blogId : data?.site?.host ?? 'site';
	const userId = data?.user?.current_user?.id ?? 'user';
	return `jetpack-videopress-preferences-${ scope }-${ userId }`;
}

/**
 * Read the raw persisted preferences payload synchronously from storage.
 *
 * @return The parsed payload, or an empty object when nothing is stored.
 */
function readStoredData(): PersistenceData {
	try {
		const raw = window.localStorage.getItem( getStorageKey() );
		return raw ? JSON.parse( raw ) : {};
	} catch {
		return {};
	}
}

let persistenceLayerRegistered = false;

/**
 * Register a localStorage-backed persistence layer on the preferences store.
 *
 * The preferences store calls `get()` once on registration to hydrate, then
 * `set()` with the full preferences payload on every change. We mirror that
 * payload into localStorage under a per-site/per-user key. Idempotent: only
 * the first dashboard mount actually wires the layer.
 *
 * @param registerLayer - The preferences store's `setPersistenceLayer` action.
 */
function ensurePersistenceLayer(
	registerLayer: ( layer: {
		get: () => Promise< PersistenceData >;
		set: ( value: PersistenceData ) => void;
	} ) => void
): void {
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
				// Storage may be unavailable (private mode, quota). The view
				// still works for the session; it just won't persist.
			}
		},
	} );
}

/**
 * Validate and normalize a raw persisted value into a partial view we trust.
 * Anything that doesn't match the current schema is dropped so a single bad
 * field can't break hydration of the rest.
 *
 * @param raw - The untrusted persisted value.
 * @return A sanitized partial view (possibly empty).
 */
function sanitizePersistedView( raw: unknown ): Partial< PersistedView > {
	if ( ! raw || typeof raw !== 'object' ) {
		return {};
	}

	const candidate = raw as Record< string, unknown >;
	const result: Partial< PersistedView > = {};

	if ( typeof candidate.type === 'string' && VALID_TYPES.has( candidate.type as View[ 'type' ] ) ) {
		result.type = candidate.type as View[ 'type' ];
	}

	if ( Array.isArray( candidate.fields ) ) {
		const fields = candidate.fields.filter(
			( id ): id is string => typeof id === 'string' && KNOWN_FIELD_IDS.has( id )
		);
		// Only keep `fields` if every persisted entry is known. A mismatch
		// signals a stale schema, so we'd rather fall back to the default.
		if ( fields.length === candidate.fields.length ) {
			result.fields = fields;
		}
	}

	if ( typeof candidate.perPage === 'number' && candidate.perPage > 0 ) {
		result.perPage = candidate.perPage;
	}

	if ( candidate.sort && typeof candidate.sort === 'object' ) {
		const sort = candidate.sort as Record< string, unknown >;
		if (
			typeof sort.field === 'string' &&
			KNOWN_FIELD_IDS.has( sort.field ) &&
			typeof sort.direction === 'string' &&
			VALID_SORT_DIRECTIONS.has( sort.direction )
		) {
			result.sort = { field: sort.field, direction: sort.direction as 'asc' | 'desc' };
		}
	}

	if ( candidate.layout && typeof candidate.layout === 'object' ) {
		const layout = candidate.layout as Record< string, unknown >;
		const nextLayout: Record< string, unknown > = {};
		if ( typeof layout.previewSize === 'number' ) {
			nextLayout.previewSize = layout.previewSize;
		}
		if ( typeof layout.density === 'string' && VALID_DENSITIES.has( layout.density ) ) {
			nextLayout.density = layout.density;
		}
		if ( Object.keys( nextLayout ).length > 0 ) {
			result.layout = nextLayout as View[ 'layout' ];
		}
	}

	return result;
}

/**
 * Reduce a full `View` down to the persisted whitelist. `search` is dropped
 * and `page`/`filters` are intentionally not persisted.
 *
 * @param view - The current full view.
 * @return The whitelisted subset to persist.
 */
function toPersistedView( view: View ): PersistedView {
	return {
		type: view.type,
		fields: view.fields,
		sort: view.sort,
		perPage: view.perPage,
		layout: view.layout,
	};
}

/**
 * Hook that hydrates the initial Library view from per-user preferences and
 * returns a writer to persist subsequent changes.
 *
 * @param defaultView - The fallback view used when nothing is persisted or
 *                    the persisted value is stale/invalid.
 * @return A tuple of `[ initialView, persistView ]`.
 */
export function usePersistedView( defaultView: View ): [ View, ( view: View ) => void ] {
	const { setPersistenceLayer, set } = useDispatch( preferencesStore );

	// Register the persistence layer before reading anything from the store.
	ensurePersistenceLayer( setPersistenceLayer );

	// Hydrate once, synchronously, straight from storage. The preferences
	// store's persistence layer hydrates asynchronously, which would race
	// the first paint; reading localStorage directly lets DataViews mount
	// with the persisted view immediately. The store still owns subsequent
	// writes (and mirrors them back to the same storage key).
	const initialView = useRef< View | null >( null );
	// Serialized snapshot of the last subset we persisted, so we can skip
	// redundant writes (see `persistView`).
	const lastPersisted = useRef< string | null >( null );
	if ( initialView.current === null ) {
		const scoped = readStoredData()[ PREFERENCES_SCOPE ] as Record< string, unknown > | undefined;
		const sanitized = sanitizePersistedView( scoped?.[ PREFERENCES_NAME ] );
		initialView.current = {
			...defaultView,
			...sanitized,
			// Always start on the first page; never restore a stale search.
			page: 1,
			search: '',
		};
		// Seed the dedup baseline from the hydrated view so the first real
		// change isn't written back as a no-op.
		lastPersisted.current = JSON.stringify( toPersistedView( initialView.current ) );
	}

	const persistView = useCallback(
		( view: View ) => {
			// `onChangeView` fires for every view change, including non-persisted
			// state like `search`, `page`, and `filters`. Only write when the
			// whitelisted subset actually changes, so a search keystroke doesn't
			// hammer localStorage with an identical payload.
			const subset = toPersistedView( view );
			const serialized = JSON.stringify( subset );
			if ( serialized === lastPersisted.current ) {
				return;
			}
			lastPersisted.current = serialized;
			set( PREFERENCES_SCOPE, PREFERENCES_NAME, subset );
		},
		[ set ]
	);

	return useMemo( () => [ initialView.current as View, persistView ], [ persistView ] );
}
