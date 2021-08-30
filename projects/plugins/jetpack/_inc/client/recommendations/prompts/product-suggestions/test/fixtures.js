export function buildInitialState() {
	return {
		jetpack: {
			initialState: {
				recommendationsStep: 'product-suggestions',
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
			siteData: {
				data: {
					plan: {
						product_slug: 'jetpack_free',
					},
					sitePurchases: [],
				},
			},
			recommendations: {
				data: {
					'product-suggestions-selection': 'jetpack_backup_daily',
				},
				productSuggestions: [
					{
						id: 2100,
						slug: 'jetpack_backup_daily',
						title: 'Backup Daily',
						description: 'Product description...',
						cost: 10,
						currency_code: 'USD',
						cost_timeframe: 'per month',
						billing_timeframe: 'paid yearly',
						cta_text: 'Learn More',
						cta_link: 'https://jetpack.com/',
						features: [
							'First feature',
							'Second feature',
							'Third feature',
						],
					},
					{
						id: 2010,
						slug: 'jetpack_security_daily',
						title: 'Security Daily',
						description: 'Product description...',
						cost: 10,
						currency_code: 'USD',
						cost_timeframe: 'per month',
						billing_timeframe: 'paid yearly',
						cta_text: 'Learn More',
						cta_link: 'https://jetpack.com/',
						features: [
							'First feature',
							'Second feature',
							'Third feature',
							'Forth feature',
							'Fifth feature',
						],
					}
				],
				requests: {
					isFetchingRecommendationsProductSuggestions: false,
				},
			},
			settings: {
				items: [],
			},
		},
	};
}
