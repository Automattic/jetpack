/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addFilter } from '@wordpress/hooks';
import { registerBlockVariation, unregisterBlockVariation } from '@wordpress/blocks';
import { G, Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const embedInstagramIcon = (
	<SVG viewBox="0 0 24 24">
		<G>
			<Path d="M12 4.622c2.403 0 2.688.01 3.637.052.877.04 1.354.187 1.67.31.42.163.72.358 1.036.673.315.315.51.615.673 1.035.123.317.27.794.31 1.67.043.95.052 1.235.052 3.638s-.01 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.67-.163.42-.358.72-.673 1.036-.315.315-.615.51-1.035.673-.317.123-.794.27-1.67.31-.95.043-1.234.052-3.638.052s-2.688-.01-3.637-.052c-.877-.04-1.354-.187-1.67-.31-.42-.163-.72-.358-1.036-.673-.315-.315-.51-.615-.673-1.035-.123-.317-.27-.794-.31-1.67-.043-.95-.052-1.235-.052-3.638s.01-2.688.052-3.637c.04-.877.187-1.354.31-1.67.163-.42.358-.72.673-1.036.315-.315.615-.51 1.035-.673.317-.123.794-.27 1.67-.31.95-.043 1.235-.052 3.638-.052M12 3c-2.444 0-2.75.01-3.71.054s-1.613.196-2.185.418c-.592.23-1.094.538-1.594 1.04-.5.5-.807 1-1.037 1.593-.223.572-.375 1.226-.42 2.184C3.01 9.25 3 9.555 3 12s.01 2.75.054 3.71.196 1.613.418 2.186c.23.592.538 1.094 1.038 1.594s1.002.808 1.594 1.038c.572.222 1.227.375 2.185.418.96.044 1.266.054 3.71.054s2.75-.01 3.71-.054 1.613-.196 2.186-.418c.592-.23 1.094-.538 1.594-1.038s.808-1.002 1.038-1.594c.222-.572.375-1.227.418-2.185.044-.96.054-1.266.054-3.71s-.01-2.75-.054-3.71-.196-1.613-.418-2.186c-.23-.592-.538-1.094-1.038-1.594s-1.002-.808-1.594-1.038c-.572-.222-1.227-.375-2.185-.418C14.75 3.01 14.445 3 12 3zm0 4.378c-2.552 0-4.622 2.07-4.622 4.622s2.07 4.622 4.622 4.622 4.622-2.07 4.622-4.622S14.552 7.378 12 7.378zM12 15c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm4.804-8.884c-.596 0-1.08.484-1.08 1.08s.484 1.08 1.08 1.08c.596 0 1.08-.484 1.08-1.08s-.483-1.08-1.08-1.08z"></Path>
		</G>
	</SVG>
);

const instagramVariation = {
	name: 'instagram',
	title: 'Instagram',
	icon: embedInstagramIcon,
	keywords: [ __( 'image' ), __( 'social' ) ],
	description: __( 'Embed an Instagram post.' ),
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
