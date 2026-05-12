import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
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

interface MutateCallbacks {
	onSuccess?: ( result: PodcastSettings ) => void;
	onError?: ( error: unknown ) => void;
}

/**
 * Read the current `podcasting_*` options out of the core-data 'site' entity.
 *
 * Matches the Forms / VideoPress pattern. On WPCOM Simple/Atomic the package's
 * `register_setting()` calls route through the standard WP REST settings
 * controller, so `/wp/v2/settings` exposes the keys here directly.
 *
 * @return `{ data, isLoading }` matching the prior TanStack-shaped contract.
 */
export function usePodcastSettings(): { data: PodcastSettings | undefined; isLoading: boolean } {
	const { record, hasResolved } = useEntityRecord< Record< string, unknown > >( 'root', 'site' );
	// Memoised so the derived object identity is stable across renders. Without
	// this, every render builds a new `data` object, breaking reference checks
	// downstream (Settings' isDirty was permanently true on `podcasting_show_urls`).
	const data = useMemo( () => ( record ? pickPodcastFields( record ) : undefined ), [ record ] );
	return { data, isLoading: ! hasResolved };
}

/**
 * Save a partial settings update through core-data.
 *
 * The server merges the patch into the stored settings and returns the full
 * record, which core-data uses to refresh the cache. Snackbars are dispatched
 * here so callers don't have to wire them up.
 *
 * @return `{ mutate, isPending }` matching the prior TanStack-shaped contract.
 */
export function useUpdatePodcastSettings(): {
	mutate: ( updates: PodcastSettingsUpdate, callbacks?: MutateCallbacks ) => void;
	isPending: boolean;
} {
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const isPending = useSelect(
		select => !! select( coreStore ).isSavingEntityRecord( 'root', 'site', undefined ),
		[]
	);

	const mutate = useCallback(
		( updates: PodcastSettingsUpdate, { onSuccess, onError }: MutateCallbacks = {} ) => {
			saveEntityRecord( 'root', 'site', updates as Record< string, unknown > )
				.then( record => {
					if ( ! record ) {
						onError?.( new Error( 'save returned no record' ) );
						createErrorNotice(
							__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
							{ type: 'snackbar' }
						);
						return;
					}
					onSuccess?.( pickPodcastFields( record as Record< string, unknown > ) );
					createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), { type: 'snackbar' } );
				} )
				.catch( error => {
					onError?.( error );
					createErrorNotice(
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
						{ type: 'snackbar' }
					);
				} );
		},
		[ saveEntityRecord, createSuccessNotice, createErrorNotice ]
	);

	return { mutate, isPending };
}
