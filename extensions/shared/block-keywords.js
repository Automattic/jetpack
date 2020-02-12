/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { _x } from '@wordpress/i18n';
import { includes } from 'lodash';

/**
 * Filters block registration to add keywords to core blocks.
 *
 * @param {Object} settings Block Settings.
 * @param {string} name     Block name.
 * @return {Object} Filtered block settings.
 */
function addBlockKeywords( settings, name ) {
	const social = _x( 'social', 'block search term', 'jetpack' );
	const survey = _x( 'survey', 'block search term', 'jetpack' );
	const video = _x( 'video', 'block search term', 'jetpack' );

	switch ( name ) {
		case 'core-embed/facebook':
		case 'core-embed/instagram':
		case 'core-embed/tumblr':
		case 'core-embed/twitter':
			if ( ! includes( settings.keywords, social ) ) {
				settings.keywords.push( social );
			}
			break;

		case 'core-embed/crowdsignal':
			if ( ! includes( settings.keywords, survey ) ) {
				settings.keywords.push( survey );
			}
			break;

		case 'core-embed/hulu':
			if ( ! includes( settings.keywords, video ) ) {
				settings.keywords.push( video );
			}
			break;
	}

	return settings;
}

addFilter( 'blocks.registerBlockType', 'jetpack/block-keywords', addBlockKeywords );
