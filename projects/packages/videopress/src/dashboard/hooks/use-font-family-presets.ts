import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

export type FontFamilyPreset = { name?: string; slug: string; fontFamily: string };

type PresetsByOrigin = FontFamilyPreset[] | Record< string, FontFamilyPreset[] | undefined >;

type ThemeGlobalStyles = {
	settings?: { typography?: { fontFamilies?: PresetsByOrigin } };
};

/**
 * Flatten font-family presets that come either as one list or keyed by origin,
 * in the order the block editor lists them: custom, theme, then default.
 *
 * @param presets - The `typography.fontFamilies` setting.
 * @return The presets, without duplicate slugs.
 */
export function flattenFontFamilyPresets(
	presets: PresetsByOrigin | undefined
): FontFamilyPreset[] {
	if ( ! presets ) {
		return [];
	}
	const lists = Array.isArray( presets )
		? [ presets ]
		: [ presets.custom, presets.theme, presets.default ];

	const seen = new Set< string >();
	return lists
		.flatMap( list => ( Array.isArray( list ) ? list : [] ) )
		.filter( preset => {
			if ( ! preset?.slug || seen.has( preset.slug ) ) {
				return false;
			}
			seen.add( preset.slug );
			return true;
		} );
}

/**
 * The active theme's font-family presets, which the Video Playlist block
 * offers for its entry titles.
 *
 * @return The presets; empty while loading or when the theme has none.
 */
export function useFontFamilyPresets(): FontFamilyPreset[] {
	const query = useQuery( {
		queryKey: [ 'jetpack-videopress-font-family-presets' ],
		queryFn: async () => {
			const themes = await apiFetch< Array< { stylesheet: string } > >( {
				path: '/wp/v2/themes?status=active&_fields=stylesheet',
			} );
			const stylesheet = themes?.[ 0 ]?.stylesheet;
			if ( ! stylesheet ) {
				return [];
			}
			const styles = await apiFetch< ThemeGlobalStyles >( {
				path: `/wp/v2/global-styles/themes/${ encodeURIComponent( stylesheet ) }`,
			} );
			return flattenFontFamilyPresets( styles?.settings?.typography?.fontFamilies );
		},
		staleTime: Infinity,
		retry: false,
	} );

	return query.data ?? [];
}
