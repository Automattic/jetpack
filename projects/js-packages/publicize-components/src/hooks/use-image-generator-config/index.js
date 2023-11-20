import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { getJetpackSocialOptions, getImageGeneratorPostSettings } from '../../utils';

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
 * @property {Function} updateProperty - Callback to update various SIG settings.
 * @property {Function} setToken - Callback to change the token.
 */

/**
 * Hook to handle storing and retrieving image generator config.
 *
 * @returns {ImageGeneratorConfigHook} - An object with the attached media hook properties set.
 */
export default function useImageGeneratorConfig() {
	const { editPost } = useDispatch( editorStore );

	const { isPostPublished } = useSelect( select => ( {
		isPostPublished: select( editorStore ).isCurrentPostPublished(),
	} ) );

	const _commitPostUpdate = useCallback(
		settings => {
			editPost( {
				meta: {
					jetpack_social_options: {
						...getJetpackSocialOptions(),
						image_generator_settings: settings,
					},
				},
			} );
		},
		[ editPost ]
	);

	const updateProperty = useCallback(
		( key, value ) => {
			const settings = { ...getImageGeneratorPostSettings(), [ key ]: value };
			_commitPostUpdate( settings );
		},
		[ _commitPostUpdate ]
	);

	const updateSettings = useCallback(
		settings => {
			const newSettings = { ...getImageGeneratorPostSettings(), ...settings };
			_commitPostUpdate( newSettings );
		},
		[ _commitPostUpdate ]
	);

	return {
		...getCurrentSettings( getJetpackSocialOptions().image_generator_settings, isPostPublished ),
		setIsEnabled: value => updateProperty( 'enabled', value ),
		setToken: value => updateProperty( 'token', value ),
		updateSettings,
	};
}
