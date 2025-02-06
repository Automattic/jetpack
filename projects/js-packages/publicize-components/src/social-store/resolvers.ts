import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { getSocialScriptData } from '../utils/script-data';
import { normalizeShareStatus } from '../utils/share-status';
import { setConnections } from './actions/connection-data';
import { fetchPostShareStatus, receivePostShareStaus } from './actions/share-status';
import { PostShareStatus } from './types';

/**
 * Resolves the connections from the post.
 *
 * @return {Function} Resolver
 */
export function getConnections() {
	return function ( { dispatch, registry } ) {
		const editor = registry.select( editorStore );
		if ( ! editor.getCurrentPostId() ) {
			return;
		}
		// Get the initial connections from the post meta
		const connections = editor.getEditedPostAttribute( 'jetpack_publicize_connections' );

		/**
		 * If by any chance the REST meta validation fails,
		 * the value can be in the following format:
		 *
		 * {
		 * "errors": { "rest_invalid_type": [] },
		 * "error_data": { "rest_invalid_type": { "param": "" } }
		 * }
		 *
		 * It's because of https://github.com/Automattic/jetpack/blob/42a62f9821d4d5c89866e09813eafaad7648d243/projects/packages/publicize/src/class-connections-post-field.php#L224-L228
		 *
		 * So, we need to check if the value is actually an array or not.
		 */
		if ( ! Array.isArray( connections ) ) {
			// eslint-disable-next-line no-console
			console.error( 'Invalid connections data received from the post meta.', connections );
			return;
		}

		dispatch( setConnections( connections || [] ) );
	};
}

/**
 * Resolves the post share status.
 *
 * @param {number} _postId - The post ID.
 *
 * @return {Function} Resolver
 */
export function getPostShareStatus( _postId ) {
	return async ( { dispatch, registry } ) => {
		// Default to the current post ID if none is provided.
		const postId = _postId || registry.select( editorStore ).getCurrentPostId();
		const { feature_flags } = getSocialScriptData();

		if ( ! feature_flags.useShareStatus ) {
			return;
		}

		try {
			dispatch( fetchPostShareStatus( postId ) );
			let result = await apiFetch< PostShareStatus >( {
				path: `jetpack/v4/social/share-status/${ postId }`,
			} );

			result = normalizeShareStatus( result );

			dispatch( receivePostShareStaus( result, postId ) );
		} catch {
			dispatch( fetchPostShareStatus( postId, false ) );
		}
	};
}

/**
 * Resolves the social module settings to ensure the core-data entities are registered.
 *
 * @return {Function} Resolver
 */
export function getSocialModuleSettings() {
	return async ( { registry } ) => {
		const { socialToggleBase } = getSocialScriptData().api_paths;

		const jetpackEntities = registry.select( coreStore ).getEntitiesConfig( 'jetpack/v4' );

		if ( ! jetpackEntities.some( ( { name } ) => name === socialToggleBase ) ) {
			await registry.dispatch( coreStore ).addEntities( [
				{
					kind: 'jetpack/v4',
					name: socialToggleBase,
					baseURL: `/jetpack/v4/${ socialToggleBase }`,
					label: __( 'Social Settings', 'jetpack-publicize-components' ),
				},
			] );
		}
	};
}

export default {
	getConnections,
	getPostShareStatus,
	getSocialModuleSettings,
};
