/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addFilter } from '@wordpress/hooks';
import { registerBlockVariation, unregisterBlockVariation } from '@wordpress/blocks';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InstagramIcon } from '../../shared/icons';

const instagramVariation = {
	name: 'instagram',
	title: 'Instagram',
	icon: InstagramIcon,
	keywords: [
		_x( 'image', 'block search term', 'jetpack' ),
		_x( 'social', 'block search term', 'jetpack' ),
	],
	description: __( 'Embed an Instagram post.', 'jetpack' ),
	patterns: [ /^https?:\/\/(www\.)?instagr(\.am|am\.com)\/.+/i ],
	attributes: { providerNameSlug: 'instagram', responsive: true },
};

/**
 * Re-enable the Instagram embed block variation by making it appear in the inserter
 * and its URL pattern parseable again.
 *
 * Relevant for Gutenberg >= 9.0, where the aforementioned block was deprecated*[0] because
 * they do not support the oEmbed changes that Facebook is going to implement on Oct. 24th, 2020,
 * and Core has currently no plans to support it.
 *
 * However, we do plan on keeping support for these embeds in Jetpack and WordPress.com by sending an
 * access token alongside the oEmbed API request.
 *
 * Our goal is for this go unnoticed by our end-users, as this is only an implementation detail.
 *
 * *[0] https://github.com/WordPress/gutenberg/pull/24472.
 *
 * @param {object} settings - Block settings object.
 * @param {string} name - The block name
 * @returns {object} The settings for the given block with the patched variations.
 */
function reactivateInstagramEmbedBlockVariation( settings, name ) {
	if ( name !== 'core/embed' || ! settings.variations ) {
		return settings;
	}

	// Only enable the embed variation if it's supported by the backend,
	// i.e. if the `shortcodes` modules is enabled.
	apiFetch( { path: '/jetpack/v4/module/shortcodes' } ).then( shortcodesModule => {
		if ( ! shortcodesModule.activated ) {
			return;
		}

		// If `addFilter` supported async functions, we could do the following:
		//
		// const variations = settings.variations.filter( variation => variation.name !== instagramVariation.name );
		// settings.variations = [ ...variations, instagramVariation ];

		// Alas, it doesn't (yet), so we have to do it like this:
		unregisterBlockVariation( 'core/embed', instagramVariation.name );
		registerBlockVariation( 'core/embed', instagramVariation );
	} );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'reactivateInstagramEmbedBlockVariation',
	reactivateInstagramEmbedBlockVariation
);
