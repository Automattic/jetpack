/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// TODO: Re-enable when @wordpress/image-cropper is available
// import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { type AspectRatio } from '../components/media-renderer/image/editing-tools/aspect-ratio';

export default function useGetAspectRatios() {
	const baseConfig = useSelect(
		select => select( coreStore ).__experimentalGetCurrentThemeBaseGlobalStyles(),
		[]
	);
	// TODO: Re-enable when @wordpress/image-cropper is available
	// const { resetState } = useImageCropper();
	const resetState = { aspectRatio: 1 }; // Temporary fallback

	return useMemo( () => {
		const showDefaultRatios = !! baseConfig?.settings?.dimensions?.defaultAspectRatios;
		const imageAspectRatios: AspectRatio[] = [
			{
				name: __( 'Image Aspect Ratio', 'media-editor' ),
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
			theme: !! baseConfig?.settings?.dimensions?.aspectRatios?.theme?.length
				? baseConfig.settings.dimensions.aspectRatios.theme
				: [],
		};
	}, [ baseConfig, resetState ] );
}
