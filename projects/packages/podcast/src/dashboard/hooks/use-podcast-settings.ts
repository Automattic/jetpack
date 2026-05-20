import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useSyncExternalStore } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type {
	PodcastSettings,
	PodcastSettingsUpdate,
	PodcastShowState,
	PodcastShowStates,
	PodcastShowUrls,
	PodcatcherId,
} from '../types';

const REST_PATH = '/wpcom/v2/podcast/settings';

// Keep in sync with `SHOW_URL_HOSTS` in src/class-settings.php.
const PODCATCHER_IDS: readonly PodcatcherId[] = [
	'pocketcasts',
	'apple',
	'spotify',
	'youtube',
	'amazon',
	'podcastindex',
] as const;

const SHOW_STATES: readonly PodcastShowState[] = [ '', 'pending', 'active' ] as const;

const normalizeShowUrls = ( raw: unknown ): PodcastShowUrls => {
	const source = ( raw && typeof raw === 'object' ? raw : {} ) as Record< string, unknown >;
	const out = {} as PodcastShowUrls;
	for ( const id of PODCATCHER_IDS ) {
		const value = source[ id ];
		out[ id ] = typeof value === 'string' ? value : '';
	}
	return out;
};

const normalizeShowStates = ( raw: unknown ): PodcastShowStates => {
	const source = ( raw && typeof raw === 'object' ? raw : {} ) as Record< string, unknown >;
	const out = {} as PodcastShowStates;
	for ( const id of PODCATCHER_IDS ) {
		const value = source[ id ];
		out[ id ] =
			typeof value === 'string' && ( SHOW_STATES as readonly string[] ).includes( value )
				? ( value as PodcastShowState )
				: '';
	}
	return out;
};

const toString = ( value: unknown ): string => {
	if ( typeof value === 'string' ) {
		return value;
	}
	if ( value == null ) {
		return '';
	}
	return String( value );
};

const numericKey = ( key: keyof PodcastSettings ) =>
	key === 'podcasting_category_id' || key === 'podcasting_image_id';

const PODCAST_KEYS: Array< keyof PodcastSettings > = [
	'podcasting_category_id',
	'podcasting_title',
	'podcasting_talent_name',
	'podcasting_summary',
	'podcasting_copyright',
	'podcasting_explicit',
	'podcasting_image',
	'podcasting_image_id',
	'podcasting_category_1',
	'podcasting_category_2',
	'podcasting_category_3',
	'podcasting_email',
	'podcasting_show_urls',
	'podcasting_show_states',
];

const pickPodcastFields = ( raw: Record< string, unknown > ): PodcastSettings => {
	const out: Record< string, unknown > = {};
	for ( const key of PODCAST_KEYS ) {
		const value = raw[ key ];
		if ( numericKey( key ) ) {
			out[ key ] = typeof value === 'number' ? value : Number( value ?? 0 ) || 0;
		} else if ( key === 'podcasting_explicit' ) {
			out[ key ] = Boolean( value );
		} else if ( key === 'podcasting_show_urls' ) {
			out[ key ] = normalizeShowUrls( value );
		} else if ( key === 'podcasting_show_states' ) {
			out[ key ] = normalizeShowStates( value );
		} else if (
			key === 'podcasting_category_1' ||
			key === 'podcasting_category_2' ||
			key === 'podcasting_category_3'
		) {
			// Legacy WPCOM stored Apple categories HTML-entity encoded
			// ("Fashion &amp; Beauty"); decode so the value matches the raw
			// catalog keys in topics.ts.
			out[ key ] = decodeEntities( toString( value ) );
		} else {
			out[ key ] = toString( value );
		}
	}
	return out as unknown as PodcastSettings;
};

// Module-level singleton so every consumer (Settings tab, Distribution tab,
// the Podcast Episode block in the editor) shares one fetch + one cache. The
// old `useEntityRecord('root','site')` data came free via core-data's resolver;
// with a dedicated endpoint we re-implement that dedup here.
interface Store {
	data?: PodcastSettings;
	error?: unknown;
	isLoading: boolean;
	isPending: boolean;
}

let store: Store = { isLoading: true, isPending: false };
const subscribers = new Set< () => void >();

const setStore = ( next: Partial< Store > ) => {
	store = { ...store, ...next };
	subscribers.forEach( cb => cb() );
};

const getSnapshot = (): Store => store;

const subscribe = ( cb: () => void ): ( () => void ) => {
	subscribers.add( cb );
	return () => {
		subscribers.delete( cb );
	};
};

let fetchPromise: Promise< PodcastSettings > | null = null;

const fetchSettings = (): Promise< PodcastSettings > => {
	if ( fetchPromise ) {
		return fetchPromise;
	}
	setStore( { isLoading: true, error: undefined } );
	fetchPromise = apiFetch< Record< string, unknown > >( { path: REST_PATH } )
		.then( raw => {
			const data = pickPodcastFields( raw );
			setStore( { data, isLoading: false, error: undefined } );
			return data;
		} )
		.catch( error => {
			setStore( { isLoading: false, error } );
			throw error;
		} )
		.finally( () => {
			fetchPromise = null;
		} );
	return fetchPromise;
};

/**
 * Drop the cached settings and refetch. Used after server-side writes that
 * land outside the SPA's normal save path (e.g. the wpcom Pocket Casts relay
 * persists `podcasting_show_states.pocketcasts` directly).
 *
 * @return Promise resolving to the freshly-fetched settings.
 */
export const refetchPodcastSettings = (): Promise< PodcastSettings > => {
	fetchPromise = null;
	return fetchSettings();
};

/**
 * Read the current `podcasting_*` settings from `/wpcom/v2/podcast/settings`.
 *
 * Mirrors the prior TanStack-shaped contract (`{ data, isLoading }`). The
 * underlying store is shared module-wide, so multiple components mounting at
 * once only trigger one network request.
 *
 * @return `{ data, isLoading }` — data is undefined until the first fetch resolves.
 */
export function usePodcastSettings(): { data: PodcastSettings | undefined; isLoading: boolean } {
	const snapshot = useSyncExternalStore( subscribe, getSnapshot, getSnapshot );

	useEffect( () => {
		if ( ! snapshot.data && ! snapshot.error && ! fetchPromise ) {
			fetchSettings().catch( () => {
				// Error already captured in the store; nothing more to do here.
			} );
		}
	}, [ snapshot.data, snapshot.error ] );

	return { data: snapshot.data, isLoading: snapshot.isLoading && ! snapshot.data };
}

interface MutateCallbacks {
	onSuccess?: ( result: PodcastSettings ) => void;
	onError?: ( error: unknown ) => void;
	// Suppress the hook's built-in success/error snackbars when the caller
	// owns its own user-visible feedback (e.g. a modal with an inline Notice).
	silent?: boolean;
}

/**
 * Save a partial settings update via the dedicated REST endpoint. The server
 * merges the patch into stored values and returns the full record, which we
 * push back into the shared store so every consumer re-renders with the
 * latest data. Snackbars are dispatched here so callers don't have to.
 *
 * @return `{ mutate, mutateAsync, isPending }` matching the prior TanStack-shaped contract.
 */
export function useUpdatePodcastSettings(): {
	mutate: ( updates: PodcastSettingsUpdate, callbacks?: MutateCallbacks ) => void;
	mutateAsync: (
		updates: PodcastSettingsUpdate,
		options?: { silent?: boolean }
	) => Promise< PodcastSettings >;
	isPending: boolean;
} {
	const snapshot = useSyncExternalStore( subscribe, getSnapshot, getSnapshot );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const mutateAsync = useCallback(
		async (
			updates: PodcastSettingsUpdate,
			{ silent = false }: { silent?: boolean } = {}
		): Promise< PodcastSettings > => {
			setStore( { isPending: true } );
			try {
				const raw = await apiFetch< Record< string, unknown > >( {
					path: REST_PATH,
					method: 'POST',
					data: updates as Record< string, unknown >,
				} );
				const data = pickPodcastFields( raw );
				setStore( { data, isPending: false, error: undefined } );
				if ( ! silent ) {
					createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), {
						type: 'snackbar',
					} );
				}
				return data;
			} catch ( error ) {
				setStore( { isPending: false } );
				if ( ! silent ) {
					createErrorNotice(
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
						{ type: 'snackbar' }
					);
				}
				throw error;
			}
		},
		[ createSuccessNotice, createErrorNotice ]
	);

	const mutate = useCallback(
		(
			updates: PodcastSettingsUpdate,
			{ onSuccess, onError, silent = false }: MutateCallbacks = {}
		) => {
			// Default no-op keeps the rejection from going uncaught when no `onError` is passed.
			mutateAsync( updates, { silent } ).then( onSuccess, onError ?? ( () => {} ) );
		},
		[ mutateAsync ]
	);

	return { mutate, mutateAsync, isPending: snapshot.isPending };
}
