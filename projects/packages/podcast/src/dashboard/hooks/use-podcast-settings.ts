// Settings I/O. WPCOM Simple's `/wp/v2/settings` endpoint doesn't expose
// `podcasting_*` keys on GET (Simple routes through `site_settings_endpoint_get`
// which only returns whitelisted keys), so we route both reads and writes
// through `/rest/v1.4/sites/{blog_id}/settings` whenever a wpcom blog id is
// available. That mirrors the legacy Calypso `/podcasting` data path. Self-
// hosted Atomic falls back to `/wp/v2/settings`.
//
// Module-scoped cache + listener pattern keeps multiple components in sync
// without a redux/core-data dependency on this particular record.
import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type {
	PodcastSettings,
	PodcastSettingsUpdate,
	PodcastShowUrls,
	PodcatcherId,
} from '../types';

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

const settingsPath = (): string => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	return blogId > 0 ? `/rest/v1.4/sites/${ blogId }/settings` : '/wp/v2/settings';
};

// Both endpoint shapes share the `podcasting_*` keys but at different
// envelopes: `/rest/v1.4` GET wraps in `{ settings: {...} }`; POST returns
// `{ updated: {...} }` (partial). `/wp/v2` returns the flat record on both.
const unwrapGet = ( raw: unknown ): Record< string, unknown > => {
	if (
		raw &&
		typeof raw === 'object' &&
		'settings' in raw &&
		typeof ( raw as { settings: unknown } ).settings === 'object'
	) {
		return ( raw as { settings: Record< string, unknown > } ).settings;
	}
	return ( raw ?? {} ) as Record< string, unknown >;
};

const mergePost = (
	previous: Record< string, unknown > | null,
	raw: unknown
): Record< string, unknown > => {
	const base = previous ?? {};
	if (
		raw &&
		typeof raw === 'object' &&
		'updated' in raw &&
		typeof ( raw as { updated: unknown } ).updated === 'object' &&
		( raw as { updated: unknown } ).updated !== null
	) {
		return { ...base, ...( raw as { updated: Record< string, unknown > } ).updated };
	}
	return { ...base, ...( raw as Record< string, unknown > ) };
};

let cachedRaw: Record< string, unknown > | null = null;
let inflight: Promise< Record< string, unknown > > | null = null;
const subscribers = new Set< () => void >();

const notify = () => {
	for ( const cb of subscribers ) {
		cb();
	}
};

const fetchSettings = (): Promise< Record< string, unknown > > => {
	if ( inflight ) {
		return inflight;
	}
	inflight = apiFetch( { path: settingsPath(), method: 'GET' } )
		.then( raw => {
			cachedRaw = unwrapGet( raw );
			inflight = null;
			notify();
			return cachedRaw;
		} )
		.catch( err => {
			inflight = null;
			throw err;
		} );
	return inflight;
};

interface MutateCallbacks {
	onSuccess?: ( result: PodcastSettings ) => void;
	onError?: ( error: unknown ) => void;
}

const deriveData = (): PodcastSettings | undefined =>
	cachedRaw ? pickPodcastFields( cachedRaw ) : undefined;

/**
 * Read the current `podcasting_*` options.
 *
 * @return `{ data, isLoading }` matching the prior TanStack-shaped contract.
 */
export function usePodcastSettings(): { data: PodcastSettings | undefined; isLoading: boolean } {
	// Real React state (not a module dep) so React's hook-deps lint stays happy
	// and reference equality holds across renders that don't touch the cache.
	const [ data, setData ] = useState< PodcastSettings | undefined >( deriveData );

	useEffect( () => {
		const cb = () => setData( deriveData() );
		subscribers.add( cb );
		// Sync to the current cache in case `useState`'s lazy init ran before a
		// prior fetch resolved (race when a sibling component triggered the
		// inflight fetch while we were still mounting).
		setData( deriveData() );
		if ( ! cachedRaw && ! inflight ) {
			fetchSettings().catch( () => {
				/* surfaced via the next save's error notice */
			} );
		}
		return () => {
			subscribers.delete( cb );
		};
	}, [] );

	return { data, isLoading: ! data };
}

/**
 * Save a partial settings update.
 *
 * The shared module cache is updated from the POST response so concurrent
 * `usePodcastSettings` consumers reflect the save without an extra round-trip.
 * Snackbars are dispatched here so callers don't have to wire them up.
 *
 * @return `{ mutate, isPending }` matching the prior TanStack-shaped contract.
 */
export function useUpdatePodcastSettings(): {
	mutate: ( updates: PodcastSettingsUpdate, callbacks?: MutateCallbacks ) => void;
	isPending: boolean;
} {
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const [ isPending, setIsPending ] = useState( false );

	const mutate = useCallback(
		( updates: PodcastSettingsUpdate, { onSuccess, onError }: MutateCallbacks = {} ) => {
			setIsPending( true );
			apiFetch( { path: settingsPath(), method: 'POST', data: updates } )
				.then( raw => {
					setIsPending( false );
					cachedRaw = mergePost( cachedRaw, raw );
					notify();
					onSuccess?.( pickPodcastFields( cachedRaw ) );
					createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), { type: 'snackbar' } );
				} )
				.catch( error => {
					setIsPending( false );
					onError?.( error );
					createErrorNotice(
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
						{ type: 'snackbar' }
					);
				} );
		},
		[ createSuccessNotice, createErrorNotice ]
	);

	return { mutate, isPending };
}
