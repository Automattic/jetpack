/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addFilter } from '@wordpress/hooks';
import { registerBlockVariation, unregisterBlockVariation } from '@wordpress/blocks';
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const embedFacebookIcon = {
	foreground: '#3b5998',
	src: (
		<SVG viewBox="0 0 24 24">
			<Path d="M20 3H4c-.6 0-1 .4-1 1v16c0 .5.4 1 1 1h8.6v-7h-2.3v-2.7h2.3v-2c0-2.3 1.4-3.6 3.5-3.6 1 0 1.8.1 2.1.1v2.4h-1.4c-1.1 0-1.3.5-1.3 1.3v1.7h2.7l-.4 2.8h-2.3v7H20c.5 0 1-.4 1-1V4c0-.6-.4-1-1-1z" />
		</SVG>
	),
};

const facebookVariation = {
	// Deprecate Facebook Embed per FB policy
	// See: https://developers.facebook.com/docs/plugins/oembed-legacy
	name: 'facebook',
	title: 'Facebook',
	icon: embedFacebookIcon,
	keywords: [ __( 'social' ) ],
	description: __( 'Embed a Facebook post.' ),
	patterns: [ /^https?:\/\/www\.facebook.com\/.+/i ],
	attributes: {
		providerNameSlug: 'facebook',
		previewable: false,
		responsive: true,
	},
};

/**
 * Re-enable the Facebook embed block variation by making it appear in the inserter
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
function reactivateFacebookEmbedBlockVariation( settings, name ) {
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
		// const variations = settings.variations.filter( variation => variation.name !== facebookVariation.name );
		// settings.variations = [ ...variations, facebookVariation ];

		// Alas, it doesn't (yet), so we have to do it like this:
		unregisterBlockVariation( 'core/embed', facebookVariation.name );
		registerBlockVariation( 'core/embed', facebookVariation );
	} );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'reactivateFacebookEmbedBlockVariation',
	reactivateFacebookEmbedBlockVariation
);
