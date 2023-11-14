import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { get } from 'lodash';

// Links and media attached to tweets take up 24 characters each.
const ATTACHMENT_MESSAGE_PADDING = 24;

// The maximum length is 280 characters, but there'll always be a URL attached (plus a space).
const MAXIMUM_MESSAGE_LENGTH = 280 - ATTACHMENT_MESSAGE_PADDING - 1;

/**
 * Gets the message that will be used hen sharing this post.
 *
 * @returns {string} The share message.
 */
export function getShareMessage() {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const meta = getEditedPostAttribute( 'meta' );
	const message = get( meta, [ 'jetpack_publicize_message' ], '' );

	if ( message ) {
		return message.substr( 0, getShareMessageMaxLength() );
	}

	return '';
}

/**
 * Get the maximum length that a share message can be.
 *
 * @returns {number} The maximum length of a share message.
 */
export function getShareMessageMaxLength() {
	return MAXIMUM_MESSAGE_LENGTH;
}

/**
 * Return True if Publicize Feature is enabled.
 * Otherwise, return False.
 *
 * @returns {boolean} Whether or not the publicize feature is enabled.
 */
export function getFeatureEnableState() {
	const { getEditedPostAttribute } = select( editorStore );
	const meta = getEditedPostAttribute( 'meta' );
	return get( meta, [ 'jetpack_publicize_feature_enabled' ], true );
}

/**
 * Get all Jetpack Social options.
 *
 * @returns {object} Object with Jetpack Social options.
 */
export function getJetpackSocialOptions() {
	const { getEditedPostAttribute } = select( editorStore );
	const meta = getEditedPostAttribute( 'meta' );
	return get( meta, [ 'jetpack_social_options' ], {} );
}

/**
 * Get whether the post has already been shared.
 *
 * @returns {object} Object with Jetpack Social options.
 */
export function getJetpackSocialPostAlreadyShared() {
	const { getEditedPostAttribute } = select( editorStore );
	const meta = getEditedPostAttribute( 'meta' );
	return get( meta, [ 'jetpack_social_post_already_shared' ], {} );
}

/**
 * Get a list of all attached media.
 *
 * @returns {Array<{id: string; url: string}>} An array of media IDs.
 */
export function getAttachedMedia() {
	return get( getJetpackSocialOptions(), [ 'attached_media' ], [] );
}

/**
 * Checks if the post is a social post.
 *
 * @returns {boolean} Whether the post is a social post.
 */
export function shouldUploadAttachedMedia() {
	return getJetpackSocialOptions()?.should_upload_attached_media ?? false;
}

/**
 * Get the image generator settings for a post.
 *
 * @returns {object} An object of image generator settings.
 */
export function getImageGeneratorPostSettings() {
	return getJetpackSocialOptions()?.image_generator_settings ?? {};
}

/**
 * Checks if the Instagram connection is supported.
 *
 * @returns {boolean} Whether the Instagram connection is supported
 */
export function isInstagramConnectionSupported() {
	return !! getJetpackData()?.social?.isInstagramConnectionSupported;
}

/**
 * Checks if the Instagram connection is supported.
 *
 * @returns {boolean} Whether the Instagram connection is supported
 */
export function isNextdoorConnectionSupported() {
	return !! getJetpackData()?.social?.isNextdoorConnectionSupported;
}

/**
 * Checks if the Mastodon connection is supported.
 *
 * @returns {boolean} Whether the Mastodon connection is supported
 */
export function isMastodonConnectionSupported() {
	return !! getJetpackData()?.social?.isMastodonConnectionSupported;
}
