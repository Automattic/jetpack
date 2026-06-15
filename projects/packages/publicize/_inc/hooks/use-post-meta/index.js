import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { features, useShareMessageMaxLength } from '../../utils';

/**
 * This is to avoid creating a new empty array each time the value is requested.
 */
const DEFAULT_ATTACHED_MEDIA = [];
const EMPTY_OBJECT = {};
const DEFAULT_IMAGE_GENERATOR_SETTINGS = {
	enabled: false,
};

/**
 * Returns the post meta values.
 *
 * @return {import('../../utils/types').UsePostMeta} The post meta values.
 */
export function usePostMeta() {
	const { editPost } = useDispatch( editorStore );
	const maxCharacterLength = useShareMessageMaxLength();

	const metaValues = useSelect(
		select => {
			const meta = select( editorStore ).getEditedPostAttribute( 'meta' ) || EMPTY_OBJECT;

			const isPublicizeEnabled = meta.jetpack_publicize_feature_enabled ?? true;
			const jetpackSocialOptions = meta.jetpack_social_options || EMPTY_OBJECT;
			const attachedMedia = jetpackSocialOptions.attached_media || DEFAULT_ATTACHED_MEDIA;
			const imageGeneratorSettings =
				jetpackSocialOptions.image_generator_settings ?? DEFAULT_IMAGE_GENERATOR_SETTINGS;
			const mediaSource = jetpackSocialOptions.media_source;
			const isPostAlreadyShared = meta.jetpack_social_post_already_shared ?? false;

			let shareMessage = meta.jetpack_publicize_message || '';

			if ( ! siteHasFeature( features.MESSAGE_TEMPLATES ) ) {
				shareMessage = shareMessage.substring( 0, maxCharacterLength );
			}

			return {
				isPublicizeEnabled,
				jetpackSocialOptions,
				attachedMedia,
				imageGeneratorSettings,
				mediaSource,
				isPostAlreadyShared,
				shareMessage,
			};
		},
		[ maxCharacterLength ]
	);

	const updateMeta = useCallback(
		( metaKey, metaValue ) => {
			editPost( {
				meta: {
					[ metaKey ]: metaValue,
				},
			} );
		},
		[ editPost ]
	);

	const togglePublicizeFeature = useCallback( () => {
		updateMeta( 'jetpack_publicize_feature_enabled', ! metaValues.isPublicizeEnabled );
	}, [ metaValues.isPublicizeEnabled, updateMeta ] );

	// Use a ref to always have the latest jetpackSocialOptions value
	// This prevents stale closure issues when async operations (like SIG token fetch)
	// call updateJetpackSocialOptions after user has made other changes
	const jetpackSocialOptionsRef = useRef( metaValues.jetpackSocialOptions );
	jetpackSocialOptionsRef.current = metaValues.jetpackSocialOptions;

	const updateJetpackSocialOptions = useCallback(
		( keyOrUpdates, value ) => {
			// Support both single key-value and object of updates
			const updates = typeof keyOrUpdates === 'string' ? { [ keyOrUpdates ]: value } : keyOrUpdates;

			updateMeta( 'jetpack_social_options', {
				...jetpackSocialOptionsRef.current,
				...updates,
				version: 2,
			} );
		},
		[ updateMeta ]
	);

	return useMemo(
		() => ( {
			...metaValues,
			togglePublicizeFeature,
			updateJetpackSocialOptions,
			updateMeta,
		} ),
		[ metaValues, togglePublicizeFeature, updateJetpackSocialOptions, updateMeta ]
	);
}
