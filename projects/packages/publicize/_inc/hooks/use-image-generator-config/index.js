import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useRef } from '@wordpress/element';
import { usePostMeta } from '../use-post-meta';

const getCurrentSettings = ( sigSettings, isPostPublished ) => ( {
	isEnabled: sigSettings?.enabled ?? ! isPostPublished,
	customText: sigSettings?.custom_text ?? null,
	imageType: sigSettings?.image_type ?? null,
	imageId: sigSettings?.image_id ?? null,
	template: sigSettings?.template ?? null,
	font: sigSettings?.font ?? '',
	token: sigSettings?.token ?? null,
	defaultImageId: sigSettings?.default_image_id ?? 0,
} );

/**
 * @typedef {object} ImageGeneratorConfigHook
 * @property {Array}    postSettings   - Array of post settings (custom text, image type etc).
 * @property {boolean}  isEnabled      - True if the image generator is enabled for this post.
 * @property {string}   customText     - Custom text for the generated image.
 * @property {string}   imageType      - Optional. Type of the image in the generated image.
 * @property {number}   imageId        - Optional. ID of the image in the generated image.
 * @property {string}   template       - Template for the generated image.
 * @property {string}   font           - Font for the image text.
 * @property {string}   token          - The SIG token for generating the image URL.
 * @property {number}   defaultImageId - Optional. ID of the default image.
 * @property {Function} setIsEnabled   - Callback to enable or disable the image generator for a post.
 * @property {Function} updateProperty - Callback to update various SIG settings.
 * @property {Function} updateSettings - Callback to update multiple SIG settings at once.
 * @property {Function} setToken       - Callback to change the token.
 */

/**
 * Hook to handle storing and retrieving image generator config.
 *
 * @return {ImageGeneratorConfigHook} - An object with the attached media hook properties set.
 */
export default function useImageGeneratorConfig() {
	const { imageGeneratorSettings, jetpackSocialOptions, updateJetpackSocialOptions } =
		usePostMeta();

	const { isPostPublished } = useSelect( select => ( {
		isPostPublished: select( editorStore ).isCurrentPostPublished(),
	} ) );

	// Ref to always have latest settings, avoiding stale closure issues in async callbacks
	const imageGeneratorSettingsRef = useRef( imageGeneratorSettings );
	imageGeneratorSettingsRef.current = imageGeneratorSettings;

	const updateProperty = useCallback(
		( key, value ) => {
			const settings = { ...imageGeneratorSettings, [ key ]: value };
			updateJetpackSocialOptions( 'image_generator_settings', settings );
		},
		[ imageGeneratorSettings, updateJetpackSocialOptions ]
	);

	const updateSettings = useCallback(
		settings => {
			const newSettings = { ...imageGeneratorSettings, ...settings };
			updateJetpackSocialOptions( 'image_generator_settings', newSettings );
		},
		[ imageGeneratorSettings, updateJetpackSocialOptions ]
	);

	// setToken uses a ref to get the LATEST settings at execution time,
	// preventing race conditions where async SIG fetch could overwrite
	// user's changes (like enabled: false) with stale closure values.
	const setToken = useCallback(
		value => {
			const currentSettings = imageGeneratorSettingsRef.current;
			updateJetpackSocialOptions( 'image_generator_settings', {
				...currentSettings,
				token: value,
			} );
		},
		[ updateJetpackSocialOptions ]
	);

	return {
		...getCurrentSettings( jetpackSocialOptions.image_generator_settings, isPostPublished ),
		setIsEnabled: value => updateProperty( 'enabled', value ),
		setToken,
		updateSettings,
	};
}
