import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type {
	PodcastSettings,
	PodcastSettingsUpdate,
	PodcastShowUrls,
	PodcatcherId,
} from '../types';

const QUERY_KEY = [ 'jetpack-podcast', 'settings' ] as const;

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
			out[ key ] = value === 'yes' || value === 'clean' ? value : 'no';
		} else if ( key === 'podcasting_show_urls' ) {
			out[ key ] = normalizeShowUrls( value );
		} else {
			out[ key ] = toString( value );
		}
	}
	return out as unknown as PodcastSettings;
};

// Simple sites store podcasting_* in the wpcom site-settings store, not in
// `wp_options`. The `/rest/v1.4` path is the authoritative read/write surface
// there; on Atomic, `register_setting()` makes `/wp/v2/settings` work.
const fetchSettings = async (): Promise< PodcastSettings > => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	if ( isSimpleSite() && blogId ) {
		const result = ( await apiFetch( {
			path: `/rest/v1.4/sites/${ blogId }/settings`,
			method: 'GET',
		} ) ) as { settings?: Record< string, unknown > };
		return pickPodcastFields( ( result.settings || result ) as Record< string, unknown > );
	}
	const result = ( await apiFetch( {
		path: '/wp/v2/settings',
		method: 'GET',
	} ) ) as Record< string, unknown >;
	return pickPodcastFields( result );
};

const updateSettings = async ( updates: PodcastSettingsUpdate ): Promise< PodcastSettings > => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	if ( isSimpleSite() && blogId ) {
		const result = ( await apiFetch( {
			path: `/rest/v1.4/sites/${ blogId }/settings`,
			method: 'POST',
			data: updates,
		} ) ) as { updated?: Record< string, unknown > };
		return pickPodcastFields( ( result.updated || result ) as Record< string, unknown > );
	}
	const result = ( await apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: updates,
	} ) ) as Record< string, unknown >;
	return pickPodcastFields( result );
};

/**
 * Read the current `podcasting_*` options as a single TanStack Query.
 *
 * @return Query result; `data` is the resolved settings once loaded.
 */
export function usePodcastSettings() {
	return useQuery< PodcastSettings >( {
		queryKey: QUERY_KEY,
		queryFn: fetchSettings,
		staleTime: 60_000,
	} );
}

/**
 * Mutation that patches settings with optimistic UI: cache patched immediately,
 * rolled back on error, snackbar dispatched either way.
 *
 * @return TanStack mutation; call `mutate(partial)` to save.
 */
export function useUpdatePodcastSettings() {
	const queryClient = useQueryClient();

	return useMutation<
		PodcastSettings,
		Error,
		PodcastSettingsUpdate,
		{ previous?: PodcastSettings }
	>( {
		mutationFn: updateSettings,
		onMutate: async updates => {
			await queryClient.cancelQueries( { queryKey: QUERY_KEY } );
			const previous = queryClient.getQueryData< PodcastSettings >( QUERY_KEY );
			if ( previous ) {
				// Deep-merge `podcasting_show_urls` so a partial patch doesn't
				// blow away sibling directories. Server merges the same way.
				const optimistic: PodcastSettings = {
					...previous,
					...updates,
					podcasting_show_urls: {
						...previous.podcasting_show_urls,
						...( updates.podcasting_show_urls ?? {} ),
					},
				};
				queryClient.setQueryData< PodcastSettings >( QUERY_KEY, optimistic );
			}
			return { previous };
		},
		onError: ( _error, _updates, context ) => {
			if ( context?.previous ) {
				queryClient.setQueryData( QUERY_KEY, context.previous );
			}
			dispatch( noticesStore ).createErrorNotice(
				__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
				{ type: 'snackbar' }
			);
		},
		onSuccess: data => {
			queryClient.setQueryData< PodcastSettings >( QUERY_KEY, data );
			dispatch( noticesStore ).createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), {
				type: 'snackbar',
			} );
		},
	} );
}
