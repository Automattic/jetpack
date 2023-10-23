import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { get } from 'lodash';

// Links and media attached to tweets take up 24 characters each.
const ATTACHMENT_MESSAGE_PADDING = 24;

// The maximum length is 280 characters, but there'll always be a URL attached (plus a space).
const MAXIMUM_MESSAGE_LENGTH = 280 - ATTACHMENT_MESSAGE_PADDING - 1;

/**
 * Returns the failed Publicize connections.
 *
 * @returns {Array} List of connections.
 */
export function getFailedConnections() {
	const connections = getConnections();
	return connections.filter( connection => false === connection.test_success );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * iFor example, when LinkedIn switched its API from v1 to v2.
 *
 * @returns {Array} List of service names that need reauthentication.
 */
export function getMustReauthConnections() {
	const connections = getConnections();
	return connections
		.filter( connection => 'must_reauth' === connection.test_success )
		.map( connection => connection.service_name );
}

/**
 * Returns a template for linkedIn data, based on the first linkedin account found.
 *
 * @param {object} args - Arguments.
 * @param {boolean} args.forceDefaults - Whether to use default values.
 * @returns {object} The linkedin account data.
 */
export function getLinkedInDetails( { forceDefaults = false } = {} ) {
	if ( ! forceDefaults ) {
		const connection = getConnections().find( ( { service_name } ) => 'linkedin' === service_name );

		if ( connection ) {
			return {
				name: connection.display_name,
				profileImage: connection.profile_picture,
			};
		}
	}

	return { name: '', profileImage: '' };
}

/**
 * Returns a template for Instagram data, based on the first Instagram account found.
 *
 * @returns {{name: string; profileImage: string}} The Instagram account data.
 */
export function getInstagramDetails() {
	const connection = getConnections().find(
		( { service_name } ) => 'instagram-business' === service_name
	);

	if ( connection ) {
		return {
			name: connection.username,
			profileImage: connection.profile_picture,
		};
	}

	return {
		name: 'username',
		profileImage: '',
	};
}

/**
 * Returns a template for tweet data, based on the first Twitter account found.
 *
 * @param {object} state - State object.
 * @returns {object} The Twitter account data.
 */
export function getTweetTemplate( state ) {
	/*
	 * state.connections is not used anymore,
	 * since they are stored into the post meta.
	 * This is kept for backward compatibility,
	 * especially for the selector tests.
	 * it should be removed in the future.
	 * Take a look at the getTweetstormHelper
	 * helper for more details,
	 */
	const connections = state.connections || getConnections();
	const twitterAccount = connections?.find( connection => 'twitter' === connection.service_name );

	return {
		name: twitterAccount?.profile_display_name,
		profileImage: twitterAccount?.profile_picture,
		screenName: twitterAccount?.display_name,
	};
}

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
 * Return social media connections.
 * This selector consumes the post metadata like primary source data.
 *
 * @returns {Array} An array of fresh social media connections for the current post.
 */
export function getConnections() {
	return select( editorStore ).getEditedPostAttribute( 'jetpack_publicize_connections' ) || [];
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
 * Checks if the Mastodon connection is supported.
 *
 * @returns {boolean} Whether the Mastodon connection is supported
 */
export function isMastodonConnectionSupported() {
	return !! getJetpackData()?.social?.isMastodonConnectionSupported;
}
