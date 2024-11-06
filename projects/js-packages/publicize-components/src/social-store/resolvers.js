import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { getSocialScriptData } from '../utils/script-data';
import { normalizeShareStatus } from '../utils/share-status';
import { setConnections } from './actions/connection-data';
import { setJetpackSettings } from './actions/jetpack-settings';
import { fetchPostShareStatus, receivePostShareStaus } from './actions/share-status';
import { fetchJetpackSettings } from './controls';

/**
 * Yield actions to get the Jetpack settings.
 *
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* getJetpackSettings() {
	try {
		const settings = yield fetchJetpackSettings();
		if ( settings ) {
			return setJetpackSettings( settings );
		}
	} catch ( e ) {
		// TODO: Add proper error handling here
		console.log( e ); // eslint-disable-line no-console
	}
}

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
			let result = await apiFetch( {
				path: `jetpack/v4/social/share-status/${ postId }`,
			} );

			result = normalizeShareStatus( result );

			dispatch( receivePostShareStaus( result, postId ) );
		} catch ( error ) {
			dispatch( fetchPostShareStatus( postId, false ) );
		}
	};
}

export default {
	getJetpackSettings,
	getConnections,
	getPostShareStatus,
};
