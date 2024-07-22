import { store as editorStore } from '@wordpress/editor';
import { setAutoConversionSettings } from './actions/auto-conversion-settings';
import { setConnections } from './actions/connection-data';
import { setJetpackSettings } from './actions/jetpack-settings';
import { setSocialImageGeneratorSettings } from './actions/social-image-generator-settings';
import {
	fetchJetpackSettings,
	fetchSocialImageGeneratorSettings,
	fetchAutoConversionSettings,
} from './controls';

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
 * Yield actions to get the Social Image Generator settings.
 *
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* getSocialImageGeneratorSettings() {
	try {
		const settings = yield fetchSocialImageGeneratorSettings();
		if ( settings ) {
			return setSocialImageGeneratorSettings( settings.jetpack_social_image_generator_settings );
		}
	} catch ( e ) {
		// TODO: Add proper error handling here
		console.log( e ); // eslint-disable-line no-console
	}
}

/**
 * Yield actions to get the Auto Conversion settings.
 *
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* getAutoConversionSettings() {
	try {
		const settings = yield fetchAutoConversionSettings();
		if ( settings ) {
			return setAutoConversionSettings( settings.jetpack_social_autoconvert_images );
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

export default {
	getJetpackSettings,
	getSocialImageGeneratorSettings,
	getAutoConversionSettings,
	getConnections,
};
