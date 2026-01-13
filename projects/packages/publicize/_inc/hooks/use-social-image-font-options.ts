import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { store as socialStore } from '../social-store';

export type SocialImageFontOptions = {
	fontOptions: Array< { label: string; value: string } >;
	isLoading: boolean;
};

/**
 * Get the available font options for the Social Image Generator.
 *
 * @return An array of font options, each with a label and value.
 */
export function useSocialImageFontOptions() {
	const { fontOptions, isLoading } = useSelect( select => {
		const { getSocialImageFontOptions, isFetchingSocialImageFontOptions } = select( socialStore );

		return {
			fontOptions: getSocialImageFontOptions(),
			isLoading: isFetchingSocialImageFontOptions(),
		};
	}, [] );

	return useMemo< SocialImageFontOptions >( () => {
		return {
			fontOptions: isLoading
				? [
						{
							label: __( 'Loading…', 'jetpack-publicize-pkg' ),
							value: '',
						},
				  ]
				: [
						{
							label: __( 'Default', 'jetpack-publicize-pkg' ),
							value: '',
						},
						...fontOptions.map( option => ( {
							label: option.label,
							value: option.id,
						} ) ),
				  ],
			isLoading,
		};
	}, [ fontOptions, isLoading ] );
}
