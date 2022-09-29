/**
 * Build the Rewind fixture object.
 *
 * @param {object} rewindStatus - – rewind status of the site
 * @returns {object} Status.
 */
function rewindFixture( rewindStatus ) {
	return {
		data: {
			status: rewindStatus,
		},
	};
}

/**
 * Build the site data fixture object.
 *
 * @param {object} options - Options
 * @param {string} options.productSlug - – product slug of the site's plan
 * @returns {object} Fixture.
 */
function siteDataFixture( { productSlug } ) {
	return {
		requests: {
			isFetchingSiteDiscount: false,
		},
		data: {
			plan: {
				product_slug: productSlug,
			},
		},
	};
}

/**
 * Build the intro offers fixture object.
 *
 * @returns {object} Fixture.
 */
function introOffersFixture() {
	return {
		requests: {
			isFetching: false,
		},
		data: [
			{
				product_id: 2016,
				product_slug: 'jetpack_security_t1_yearly',
				currency_code: 'USD',
				formatted_price: 'US$107.40',
				original_price: 299.4,
				raw_price: 107.4,
				discount_percentage: 64,
				ineligible_reason: null,
			},
			{
				product_id: 2112,
				product_slug: 'jetpack_backup_t1_yearly',
				currency_code: 'USD',
				formatted_price: 'US$47.40',
				original_price: 119.4,
				raw_price: 47.4,
				discount_percentage: 60,
				ineligible_reason: null,
			},
		],
	};
}

/**
 * Build the upsell fixture object.
 *
 * @param {object} options - Options.
 * @param {boolean} options.hideUpsell - Whether to hide the upsell.
 * @returns {object} Fixture.
 */
function upsellFixture( { hideUpsell } ) {
	return {
		product_id: 2101,
		product_slug: 'jetpack_backup_t1_monthly',
		billing_timeframe: 'billed monthly',
		cost_timeframe: 'per month',
		cta_text: 'Learn more',
		currency_code: 'USD',
		description:
			'Never lose a word, image, page, or time worrying about your site with automated off-site backups and one-click restores.',
		features: [
			'Automated daily off-site backups',
			'One-click restores',
			'Unlimited secure storage',
		],
		header: 'Recommended premium product',
		hide_upsell: hideUpsell,
		price: 9.95,
		title: 'Backup Daily',
	};
}

/**
 * Build an object that can be use as a Redux store initial state.
 *
 * @param {object} options - Options.
 * @param {boolean} options.hideUpsell - – whether to show the upsell product card
 * @param {string} options.productSlug - – product slug of the site's plan
 * @param {object} options.rewindStatus - – rewind status of the site
 * @param {object} options.enabledRecommendations - Enabled recommendations.
 * @param {object} options.skippedRecommendations - Skipped recommendations.
 * @param options.skippedRecommendations
 * @returns {object} – initial Redux state
 */
export function buildInitialState( {
	enabledRecommendations = {},
	skippedRecommendations = [],
	hideUpsell = false,
	productSlug,
	rewindStatus = { state: 'unavailable' },
} = {} ) {
	return {
		jetpack: {
			initialState: {
				userData: {
					currentUser: 100,
				},
			},
			connection: {
				status: {
					siteConnected: {
						hasConnectedOwner: true,
					},
				},
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
			pluginsData: {
				items: {
					'jetpack/jetpack.php': {
						active: true,
					},
				},
			},
			recommendations: {
				upsell: upsellFixture( { hideUpsell } ),
				requests: {},
				data: {
					skippedRecommendations,
				},
				installing: {},
			},
			rewind: rewindFixture( rewindStatus ),
			settings: {
				items: enabledRecommendations,
			},
			siteData: siteDataFixture( { productSlug } ),
			introOffers: introOffersFixture(),
		},
	};
}
