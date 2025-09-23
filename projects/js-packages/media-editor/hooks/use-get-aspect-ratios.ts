/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// TODO: Implement image cropping functionality
// import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { type AspectRatio } from '../components/media-renderer/image/editing-tools/aspect-ratio/index.ts';

/**
 *
 */
export default function useGetAspectRatios() {
	const baseConfig = useSelect(
		select => ( select( coreStore ) as any ).__experimentalGetCurrentThemeBaseGlobalStyles(),
		[]
	) as any;
	// TODO: Implement image cropping functionality
	// const { resetState } = useImageCropper();
	const resetState = { aspectRatio: 1 };

	return useMemo( () => {
		const showDefaultRatios = !! baseConfig?.settings?.dimensions?.defaultAspectRatios;
		const imageAspectRatios: AspectRatio[] = [
			{
				name: __( 'Image Aspect Ratio', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ),
				slug: 'image',
				ratio: resetState?.aspectRatio ?? 1,
			},
		];

		return {
			imageAspectRatios,
			default:
				showDefaultRatios && !! baseConfig?.settings?.dimensions?.aspectRatios?.default?.length
					? baseConfig.settings.dimensions.aspectRatios.default
					: [],
			theme: baseConfig?.settings?.dimensions?.aspectRatios?.theme?.length
				? baseConfig.settings.dimensions.aspectRatios.theme
				: [],
		};
	}, [ baseConfig, resetState ] );
}
