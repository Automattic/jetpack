import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

const PUBLICIZE_STORE_ID = 'jetpack/publicize';

const getCurrentSettings = ( sigSettings, isPostPublished ) => ( {
	isEnabled: sigSettings?.enabled ?? ! isPostPublished,
	customText: sigSettings?.custom_text ?? null,
	imageType: sigSettings?.image_type ?? null,
	imageId: sigSettings?.image_id ?? null,
	template: sigSettings?.template ?? null,
	token: sigSettings?.token ?? null,
} );

/**
 * @typedef {object} ImageGeneratorConfigHook
 * @property {Array} postSettings - Array of post settings (custom text, image type etc).
 * @property {boolean} isEnabled - True if the image generator is enabled for this post.
 * @property {string} customText - Custom text for the generated image.
 * @property {string} imageType - Optional. Type of the image in the generated image.
 * @property {number} imageId - Optional. ID of the image in the generated image.
 * @property {string} template - Template for the generated image.
 * @property {Function} setIsEnabled - Callback to enable or disable the image generator for a post.
 * @property {Function} setCustomText - Callback to change the custom text.
 * @property {Function} setImageType - Callback to change the image type.
 * @property {Function} setImageId - Callback to change the image ID.
 * @property {Function} setTemplate - Callback to change the template.
 * @property {Function} setToken - Callback to change the token.
 */

/**
 * Hook to handle storing and retrieving image generator config.
 *
 * @returns {ImageGeneratorConfigHook} - An object with the attached media hook properties set.
 */
export default function useImageGeneratorConfig() {
	const { editPost } = useDispatch( editorStore );

	const { postSettings, currentOptions } = useSelect( select => ( {
		postSettings: select( PUBLICIZE_STORE_ID ).getImageGeneratorPostSettings(),
		currentOptions: select( PUBLICIZE_STORE_ID ).getJetpackSocialOptions(),
	} ) );

	const { isPostPublished } = useSelect( select => ( {
		isPostPublished: select( editorStore ).isCurrentPostPublished(),
	} ) );

	const updateSettings = useCallback(
		( key, value ) => {
			const settings = { ...postSettings, [ key ]: value };
			editPost( {
				meta: {
					jetpack_social_options: { ...currentOptions, image_generator_settings: settings },
				},
			} );
		},
		[ currentOptions, editPost, postSettings ]
	);

	return {
		...getCurrentSettings( currentOptions?.image_generator_settings, isPostPublished ),
		setIsEnabled: value => updateSettings( 'enabled', value ),
		setCustomText: value => updateSettings( 'custom_text', value ),
		setImageType: value => updateSettings( 'image_type', value ),
		setImageId: value => updateSettings( 'image_id', value ),
		setTemplate: value => updateSettings( 'template', value ),
		setToken: value => updateSettings( 'token', value ),
	};
}
