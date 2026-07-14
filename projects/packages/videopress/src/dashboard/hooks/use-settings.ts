import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { isSimpleSite } from '../utils/is-simple';

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

/**
 * Whether `videoPressVideosPrivateForSite` is resolved server-side and therefore
 * not independently writable from this screen.
 *
 * This mirrors `Data::get_videopress_videos_private_for_site()` on the server.
 * WordPress.com Simple always derives VideoPress privacy from the whole-site
 * Privacy setting (there is no independent option), so it is always locked.
 * Private Atomic/WoA sites force every video private, locking the value to its
 * effective (true) state. On public Atomic and self-hosted Jetpack the stored
 * option is honored, so the toggle stays writable. Deciding from the settings
 * response — not the ENV — keeps Simple and private Atomic in sync with what
 * the server actually accepts.
 *
 * @param settings - The resolved settings data, or undefined while loading.
 * @return true when the value is server-controlled (render it read-only).
 */
export function isPrivateForSiteServerControlled(
	settings: Pick< Settings, 'siteType' | 'siteIsPrivate' > | undefined
): boolean {
	if ( ! settings ) {
		return false;
	}
	const { siteType, siteIsPrivate } = settings;
	return siteType === 'simple' || ( siteType === 'atomic' && siteIsPrivate );
}

const QUERY_KEY = [ 'jetpack-videopress-settings' ] as const;

/**
 * Resolve the settings endpoint for the current host. The videopress/v1
 * namespace never reaches the REST dispatcher on WordPress.com Simple,
 * so the wpcom/v2 twin (same response shape) is used there.
 *
 * @return The REST path for reading/writing VideoPress settings.
 */
function settingsPath(): string {
	return isSimpleSite() ? '/wpcom/v2/videopress/settings' : '/videopress/v1/settings';
}

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
			const raw = await apiFetch< ApiSettings >( { path: settingsPath() } );
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
				path: settingsPath(),
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
