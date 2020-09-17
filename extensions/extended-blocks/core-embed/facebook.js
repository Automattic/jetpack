/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Re-activates the Facebook and Instagram embed block variations by
 * making them appear in the inserter and their URL patterns parseable again.
 *
 * Relevant for Gutenberg >= 9.0, where the aforementioned blocks were deprecated*[0] because
 * they do not support the oEmbed changes that Facebook is going to implement on Oct. 24th, 2020,
 * and core has currently no plans to support it.
 *
 * However, we do plan on keeping support for them in Jetpack and WordPress.com by sending an
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

	/**
	 * Given the variation name and the pattern regex (the attribute that was removed from the deprecated
	 * variations) returns a new "patched" variation object that essentially reverts the deprecation changes
	 * made in https://github.com/WordPress/gutenberg/pull/24472.
	 */
	settings.variations.forEach( function ( variation ) {
		if ( variation.name !== 'facebook' ) {
			return settings;
		}
		variation.patterns = [ /^https?:\/\/www\.facebook.com\/.+/i ];
		delete variation.scope;
	} );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'reactivateFacebookEmbedBlockVariation',
	reactivateFacebookEmbedBlockVariation
);
