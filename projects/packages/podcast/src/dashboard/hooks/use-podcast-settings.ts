import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState, useSyncExternalStore } from '@wordpress/element';
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

// Package-owned endpoint, so the dashboard reads/writes the same way on
// self-hosted Jetpack as on WPCOM, independent of core /wp/v2/settings.
const SETTINGS_PATH = '/jetpack/v4/podcast/settings';

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

// Keep in sync with `SHOW_URL_HOSTS` in src/class-settings.php.
const PODCATCHER_IDS: readonly PodcatcherId[] = [
	'pocketcasts',
	'apple',
	'spotify',
	'youtube',
	'amazon',
	'podcastindex',
] as const;

const normalizeShowUrls = ( raw: unknown ): PodcastShowUrls => {
	const source = ( raw && typeof raw === 'object' ? raw : {} ) as Record< string, unknown >;
	const out = {} as PodcastShowUrls;
	for ( const id of PODCATCHER_IDS ) {
		const value = source[ id ];
		out[ id ] = typeof value === 'string' ? value : '';
	}
	return out;
};

const SHOW_STATES: readonly PodcastShowState[] = [ '', 'pending', 'active' ] as const;

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

const pickPodcastFields = ( raw: Record< string, unknown > ): PodcastSettings => {
	const numericKey = ( key: keyof PodcastSettings ) =>
		key === 'podcasting_category_id' || key === 'podcasting_image_id';

	const toString = ( value: unknown ): string => {
		if ( typeof value === 'string' ) {
			return value;
		}
		if ( value == null ) {
			return '';
		}
		return String( value );
	};

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

// One shared copy of the settings for the whole dashboard. The settings screen,
// the episode block, and the validation checks all read from here, so the data
// is fetched once and a save (or refresh) updates every reader at the same time.
// `useSyncExternalStore` is React's built-in way to subscribe a component to a
// plain module value like this — and because it needs no Context provider, the
// episode block (which renders outside the dashboard's React tree) can share it.
interface SettingsState {
	data: PodcastSettings | undefined;
	isLoading: boolean;
}

let state: SettingsState = { data: undefined, isLoading: true };
let hasFetched = false;
const listeners = new Set< () => void >();

const getState = (): SettingsState => state;

const subscribe = ( listener: () => void ): ( () => void ) => {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
};

const setState = ( next: SettingsState ): void => {
	state = next;
	listeners.forEach( listener => listener() );
};

// Fetch the settings and hand them to every reader. A non-admin (e.g. opening
// the episode block) gets a 403; we just stop loading and leave the data empty
// rather than spin forever.
const fetchSettings = (): Promise< void > =>
	apiFetch( { path: SETTINGS_PATH } )
		.then( raw =>
			setState( { data: pickPodcastFields( raw as Record< string, unknown > ), isLoading: false } )
		)
		.catch( () => setState( { data: state.data, isLoading: false } ) );

// Run the one-time initial fetch on the first mount; later mounts reuse the
// result already in the store.
const ensureFetched = (): void => {
	if ( hasFetched ) {
		return;
	}
	hasFetched = true;
	fetchSettings();
};

/**
 * Re-fetch the settings after an out-of-band server write (e.g. the Pocket Casts
 * relay persisting `podcasting_show_states`). Updates every mounted reader.
 *
 * @return Resolves once the shared store has been refreshed.
 */
export const refreshPodcastSettings = (): Promise< void > => fetchSettings();

interface MutateCallbacks {
	onSuccess?: ( result: PodcastSettings ) => void;
	onError?: ( error: unknown ) => void;
	// Suppress the hook's built-in success/error snackbars when the caller
	// owns its own user-visible feedback (e.g. a modal with an inline Notice).
	silent?: boolean;
}

/**
 * Read the current `podcasting_*` settings from the shared store, fetching them
 * once on first use.
 *
 * @return `{ data, isLoading }`.
 */
export function usePodcastSettings(): SettingsState {
	useEffect( ensureFetched, [] );
	return useSyncExternalStore( subscribe, getState );
}

/**
 * Save a partial settings update through the package's REST endpoint.
 *
 * The server merges the patch into the stored settings and returns the full
 * record, which updates the shared store. Snackbars are dispatched here so
 * callers don't have to wire them up.
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
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const [ isPending, setIsPending ] = useState( false );

	const mutateAsync = useCallback(
		async (
			updates: PodcastSettingsUpdate,
			{ silent = false }: { silent?: boolean } = {}
		): Promise< PodcastSettings > => {
			setIsPending( true );
			try {
				const raw = await apiFetch( {
					path: SETTINGS_PATH,
					method: 'PUT',
					data: updates as Record< string, unknown >,
				} );
				const saved = pickPodcastFields( raw as Record< string, unknown > );
				setState( { data: saved, isLoading: false } );
				if ( ! silent ) {
					createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), {
						type: 'snackbar',
					} );
				}
				return saved;
			} catch ( error ) {
				if ( ! silent ) {
					createErrorNotice(
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
						{ type: 'snackbar' }
					);
				}
				throw error;
			} finally {
				setIsPending( false );
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

	return { mutate, mutateAsync, isPending };
}
