import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

type ApiSettings = {
	videopress_videos_private_for_site: boolean;
	videopress_auto_subtitles_disabled: boolean;
	site_is_private: boolean;
	site_type: string;
};

export type Settings = {
	videoPressVideosPrivateForSite: boolean;
	videoPressAutoSubtitlesDisabled: boolean;
	siteIsPrivate: boolean;
	siteType: string;
};

export type SettingsPatch = Partial<
	Pick< Settings, 'videoPressVideosPrivateForSite' | 'videoPressAutoSubtitlesDisabled' >
>;

const QUERY_KEY = [ 'jetpack-videopress-settings' ] as const;

/**
 * Convert a raw REST API settings object to the camelCase shape used in JS.
 *
 * @param raw - The snake_case settings object returned by the REST API.
 * @return The camelCase Settings object used throughout the dashboard.
 */
function fromApi( raw: ApiSettings ): Settings {
	return {
		videoPressVideosPrivateForSite: raw.videopress_videos_private_for_site,
		videoPressAutoSubtitlesDisabled: raw.videopress_auto_subtitles_disabled,
		siteIsPrivate: raw.site_is_private,
		siteType: raw.site_type,
	};
}

/**
 * Fetch the VideoPress site settings from the REST API.
 *
 * @return TanStack Query result containing the Settings object.
 */
export function useSettings() {
	return useQuery< Settings >( {
		queryKey: QUERY_KEY,
		queryFn: async () => {
			const raw = await apiFetch< ApiSettings >( { path: '/videopress/v1/settings' } );
			return fromApi( raw );
		},
		staleTime: 5 * 60_000,
	} );
}

/**
 * Return a mutation for updating VideoPress site settings with optimistic updates.
 * On success the cache is updated immediately; on error the previous value is restored.
 *
 * @return TanStack Mutation object for updating Settings.
 */
export function useUpdateSettings() {
	const client = useQueryClient();
	return useMutation< void, Error, SettingsPatch, { previous?: Settings } >( {
		mutationFn: async patch => {
			const data: Partial<
				Pick<
					ApiSettings,
					'videopress_videos_private_for_site' | 'videopress_auto_subtitles_disabled'
				>
			> = {};
			if ( patch.videoPressVideosPrivateForSite !== undefined ) {
				data.videopress_videos_private_for_site = patch.videoPressVideosPrivateForSite;
			}
			if ( patch.videoPressAutoSubtitlesDisabled !== undefined ) {
				data.videopress_auto_subtitles_disabled = patch.videoPressAutoSubtitlesDisabled;
			}
			if ( Object.keys( data ).length === 0 ) {
				return;
			}
			await apiFetch( {
				path: '/videopress/v1/settings',
				method: 'POST',
				data,
			} );
		},
		onMutate: async patch => {
			await client.cancelQueries( { queryKey: QUERY_KEY } );
			const previous = client.getQueryData< Settings >( QUERY_KEY );
			if ( previous ) {
				client.setQueryData< Settings >( QUERY_KEY, { ...previous, ...patch } );
			}
			return { previous };
		},
		onError: ( _err, _patch, context ) => {
			if ( context?.previous ) {
				client.setQueryData( QUERY_KEY, context.previous );
			}
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: QUERY_KEY } );
		},
	} );
}
