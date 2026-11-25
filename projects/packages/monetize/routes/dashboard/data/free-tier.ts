import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type { APIFetchOptions } from '@wordpress/api-fetch';

const KEY = [ 'monetize', 'free-tier' ];

export const FREE_TIER_DESCRIPTION_MAX = 500;

export interface FreeTier {
	description: string;
	/** The rendered description, which only WordPress.com's settings send. */
	descriptionHtml?: string;
	hidden: boolean;
}

/**
 * Where the site's `subscription_options` are read and saved: WordPress.com's settings on Simple, Jetpack's elsewhere.
 *
 * @return The apiFetch path.
 * @throws {Error} On Simple, when the page didn't print the site's blog ID.
 */
function getSettingsPath(): string {
	if ( ! isSimpleSite() ) {
		return '/jetpack/v4/settings';
	}
	const blogId = getSiteData()?.wpcom?.blog_id;
	if ( ! blogId ) {
		// No message, so the UI shows its own.
		throw new Error();
	}
	return `/rest/v1.4/sites/${ blogId }/settings`;
}

/**
 * The free newsletter tier's description and visibility, from the site's `subscription_options`.
 *
 * @param enabled - Whether to fetch it, since only sites with a paid tier show it.
 * @return The query.
 */
export function useFreeTier( enabled = true ) {
	return useQuery( {
		queryKey: KEY,
		enabled,
		queryFn: async (): Promise< FreeTier > => {
			const response = await apiFetch< {
				settings?: {
					subscription_options?: Record< string, unknown >;
					free_tier_description_rendered?: string;
				};
				subscription_options?: Record< string, unknown >;
			} >( { path: getSettingsPath() } );
			// WordPress.com nests the settings under `settings`.
			const options = ( response.settings ?? response ).subscription_options ?? {};
			return {
				description: String( options.free_tier_description ?? '' ),
				descriptionHtml: response.settings?.free_tier_description_rendered ?? '',
				hidden: Boolean( options.hide_free_tier ),
			};
		},
	} );
}

/**
 * Saves the free tier. Both endpoints merge `subscription_options`, so the other keys keep their values.
 *
 * @return The mutation.
 */
export function useSaveFreeTier() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: async ( { description, hidden }: FreeTier ) =>
			apiFetch( {
				path: getSettingsPath(),
				method: 'POST',
				data: {
					subscription_options: {
						free_tier_description: description.trim(),
						// 1/0 so a form-encoded "false" can't read as true.
						hide_free_tier: hidden ? 1 : 0,
					},
				},
			} as APIFetchOptions ),
		onSettled: () => queryClient.invalidateQueries( { queryKey: KEY } ),
	} );
}
