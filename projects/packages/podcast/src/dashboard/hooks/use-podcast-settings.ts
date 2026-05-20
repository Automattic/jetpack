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
		if ( key === 'podcasting_category_id' || key === 'podcasting_image_id' ) {
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
			// ("Fashion &amp; Beauty"); decode to match the catalog keys in topics.ts.
			out[ key ] = decodeEntities( toString( value ) );
		} else {
			out[ key ] = toString( value );
		}
	}
	return out as unknown as PodcastSettings;
};

// Module-level singleton so every consumer (Settings + Distribution tabs, the
// Podcast Episode block) shares one fetch + one cache.
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
 * Drop the cache and refetch — for server-side writes outside the SPA save
 * path (e.g. the Pocket Casts relay persists `podcasting_show_states` directly).
 *
 * @return Freshly-fetched settings.
 */
export const refetchPodcastSettings = (): Promise< PodcastSettings > => {
	fetchPromise = null;
	return fetchSettings();
};

/**
 * Read the current `podcasting_*` settings. Shared module-wide; multiple
 * components mounting only trigger one network request.
 *
 * @return `{ data, isLoading }` — data is undefined until the first fetch resolves.
 */
export function usePodcastSettings(): { data: PodcastSettings | undefined; isLoading: boolean } {
	const snapshot = useSyncExternalStore( subscribe, getSnapshot, getSnapshot );

	useEffect( () => {
		if ( ! snapshot.data && ! snapshot.error && ! fetchPromise ) {
			fetchSettings().catch( () => {} );
		}
	}, [ snapshot.data, snapshot.error ] );

	return { data: snapshot.data, isLoading: snapshot.isLoading && ! snapshot.data };
}

interface MutateCallbacks {
	onSuccess?: ( result: PodcastSettings ) => void;
	onError?: ( error: unknown ) => void;
	// Suppress built-in snackbars when the caller renders its own inline feedback.
	silent?: boolean;
}

/**
 * Partial settings update. Server returns the full merged record, which we
 * push back into the shared store. Snackbars dispatched here unless silenced.
 *
 * @return `{ mutate, mutateAsync, isPending }`.
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
			// Default no-op so the rejection isn't uncaught when no `onError` is passed.
			mutateAsync( updates, { silent } ).then( onSuccess, onError ?? ( () => {} ) );
		},
		[ mutateAsync ]
	);

	return { mutate, mutateAsync, isPending: snapshot.isPending };
}
