/**
 * Re-activates the Facebook and Instagram embed block variations by
 * making them appear in the inserter and their URL patterns parseable again.
 *
 * Relevant for Gutenberg >= 9.0, where the aforementioned blocks were deprecated*[0] because
 * they do not support the oEmbed changes that Facebook is going to implement on Oct. 24th, 2020,
 * and core has currently no plans to support it.
 *
 * However, we do plan on keeping support for them on WPCOM/AT. Facebook is adding a token
 * authentication mechanism to its new oEmbed implementation, and we are following suit.
 * We're counting on this*[1] to result in something that continues to render the embeds
 * on the backend, using an authenticated mechanism, as required by Facebook's new policy.
 *
 * Our goal is for this go unnoticed by our end-users, as this is only an implementation detail.
 *
 * For now, we're patching them so they continue to work as before, as the current FB oEmbed implementation is still
 * active.
 *
 * *[0] https://github.com/WordPress/gutenberg/pull/24472.
 * *[1] D47837-code.
 *
 * @param {Object} settings Block settings object.
 * @param {string} name The block name
 * @return {Object} The settings for the given block with the patched variations.
 */
function reactivateFacebookAndInstagramEmbedBlockVariations( settings, name ) {
	if ( name !== 'core/embed' || ! settings.variations ) {
		return settings;
	}

	/**
	 * Given the variation name and the pattern regex (the attribute that was removed from the deprecated
	 * variations) returns a new "patched" variation object that essentially reverts the deprecation changes
	 * made in https://github.com/WordPress/gutenberg/pull/24472.
	 */
	settings.variations.forEach( function( variation ) {
		switch ( variation.name ) {
			case 'facebook':
				variation.patterns = [ /^https?:\/\/www\.facebook.com\/.+/i ];
				delete variation.scope;
				break;
			case 'instagram':
				variation.patterns = [ /^https?:\/\/(www\.)?instagr(\.am|am\.com)\/.+/i ];
				delete variation.scope;
				break;
		}
	} );

	return settings;
}
wp.hooks.addFilter( 'blocks.registerBlockType', 'reactivateFacebookAndInstagramEmbedBlockVariations', reactivateFacebookAndInstagramEmbedBlockVariations );
