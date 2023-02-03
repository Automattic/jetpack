import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

/**
 * @typedef {object} ImageGeneratorConfigHook
 * @property {Array} postSettings - Array of post settings (custom text, image type etc).
 * @property {boolean} isEnabled - True if the image generator is enabled for this post.
 * @property {string} customText - Custom text for the generated image.
 * @property {string} imageType - Optional. Type of the image in the generated image.
 * @property {number} imageId - Optional. ID of the image in the generated image.
 * @property {Function} setIsEnabled - Callback to enable or disable the image generator for a post.
 * @property {Function} setCustomText - Callback to change the custom text.
 * @property {Function} setImageType - Callback to change the image type.
 * @property {Function} setImageId - Callback to change the image ID.
 */

/**
 * Hook to handle storing and retrieving image generator config.
 *
 * @returns {ImageGeneratorConfigHook} - An object with the attached media hook properties set.
 */
export default function useImageGeneratorConfig() {
	const { editPost } = useDispatch( editorStore );

	const { postSettings, currentOptions, isPostPublished } = useSelect( select => ( {
		postSettings: select( 'jetpack/publicize' ).getImageGeneratorPostSettings(),
		currentOptions: select( 'jetpack/publicize' ).getJetpackSocialOptions(),
		isPostPublished: select( editorStore ).isCurrentPostPublished(),
	} ) );

	const updateSettings = useCallback(
		settings => {
			editPost( {
				meta: {
					jetpack_social_options: { ...currentOptions, image_generator_settings: settings },
				},
			} );
		},
		[ currentOptions, editPost ]
	);

	const updateSetting = ( setting, value ) =>
		updateSettings( { ...postSettings, [ setting ]: value } );
	const getSetting = setting => currentOptions?.image_generator_settings?.[ setting ] ?? null;

	return {
		isEnabled: getSetting( 'enabled' ) ?? ! isPostPublished,
		customText: getSetting( 'custom_text' ) ?? null,
		imageType: getSetting( 'image_type' ) ?? null,
		imageId: getSetting( 'image_id' ) ?? null,
		setIsEnabled: value => updateSetting( 'enabled', value ),
		setCustomText: value => updateSetting( 'custom_text', value ),
		setImageType: value => updateSetting( 'image_type', value ),
		setImageId: value => updateSetting( 'image_id', value ),
	};
}
