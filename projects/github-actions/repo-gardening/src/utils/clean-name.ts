/**
 * Clean up a feature name:
 * - Handle some exceptions in our codename / feature names.
 * - Replace dashes by spaces.
 * - Capitalize.
 *
 * @param name - Feature name.
 * @return Cleaned up feature name.
 */
function cleanName( name: string ): string {
	const name_exceptions: Record< string, string > = {
		'custom-post-types': 'Custom Content Types', // We name our CPTs "Custom Content Types" to avoid confusion with WordPress's CPT.
		'instagram-gallery': 'Latest Instagram Posts', // Latest Instagram Posts used to be named "Instagram Gallery".
		'mu-wpcom-plugin': 'mu-wpcom', // [Plugin] mu wpcom plugin is a bit too long.
		'premium-content': 'Paid content', // Premium Content was renamed into Paid content.
		'rating-star': 'Star Rating', // Rating Star was renamed into Star Rating.
		'recurring-payments': 'Payments', // Payments used to be called Recurring Payments.
		'render-blocking-js': 'Defer JS', // render-blocking-js is a Boost feature.
		sharedaddy: 'Sharing', // Sharedaddy is a legacy codename.
		shortcodes: 'Shortcodes / Embeds', // Our Shortcodes feature includes shortcodes and embeds.
		'simple-payments': 'Pay With Paypal', // Simple Payments was renamed to "Pay With Paypal".
		stats: 'Stats Data', // We customize the Stats module's name to differentiate from the Stats UI (Stats dashboard).
		widgets: 'Extra Sidebar Widgets', // Our widgets are "Extra Sidebar Widgets".
		'woo-sync': 'WooSync', // The WooSync module does not have a space, despite legacy naming
		wordads: 'Ad', // WordAds is a codename. We name the feature just "Ad" or "Ads".
		'wpcom-block-editor': 'WordPress.com Block Editor', // WordPress.com Block Editor lives under 'wpcom-block-editor'.
	};

	if ( name_exceptions[ name ] ) {
		// don't return here, as at least of the above (mu-wpcom) is further changed below
		name = name_exceptions[ name ];
	}

	return (
		name
			// Break up words
			.split( '-' )
			// Capitalize first letter of each word.
			.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
			// Spaces between words.
			.join( ' ' )
	);
}

export default cleanName;
