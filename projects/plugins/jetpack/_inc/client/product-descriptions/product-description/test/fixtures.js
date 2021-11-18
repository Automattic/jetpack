export function buildInitialState() {
	return {
		jetpack: {
			initialState: {
				products: {
					"backup": {
						"title": "Jetpack Backup",
						"slug": "jetpack_backup_daily",
						"description": "Never lose a word, image, page, or time worrying about your site with automated backups & one-click restores.",
						"show_promotion": true,
						"discount_percent": 40,
						"included_in_plans": [
							"security"
						],
						"features": [
							"Automated daily backups (off-site)",
							"One-click restores",
							"Unlimited backup storage"
						]
					},
					"scan": {
						"title": "Jetpack Scan",
						"slug": "jetpack_scan",
						"description": "Automatic scanning and one-click fixes keep your site one step ahead of security threats and malware.",
						"show_promotion": true,
						"discount_percent": 40,
						"included_in_plans": [
							"security"
						],
						"features": [
							"Automated daily scanning",
							"One-click fixes for most issues",
							"Instant email notifications"
						]
					},
					"search": {
						"title": "Jetpack Site Search",
						"slug": "jetpack_search",
						"description": "Help your site visitors find answers instantly so they keep reading and buying. Great for sites with a lot of content.",
						"show_promotion": true,
						"discount_percent": 40,
						"included_in_plans": [],
						"features": [
							"Instant search and indexing",
							"Powerful filtering",
							"Supports 29 languages",
							"Spelling correction"
						]
					},
					"akismet": {
						"title": "Jetpack Anti-Spam",
						"slug": "jetpack_anti_spam",
						"description": "Save time and get better responses by automatically blocking spam from your comments and forms.",
						"show_promotion": true,
						"discount_percent": 40,
						"included_in_plans": [
							"security"
						],
						"features": [
							"Comment and form spam protection",
							"Powered by Akismet",
							"Block spam without CAPTCHAs",
							"Advanced stats"
						]
					},
					"security": {
						"title": "Security Bundle",
						"slug": "jetpack_security_daily",
						"description": "Get all security products including backups, site scanning, and anti-spam.",
						"show_promotion": true,
						"discount_percent": 40,
						"included_in_plans": [],
						"features": [
							"All Backup Features ",
							"Automated real-time malware scan",
							"One-click fixes for most threats",
							"Comment & form spam protection"
						]
					}
				}
			},
			products: {
				"items": {
					"jetpack_security_daily": {
						"product_slug": "jetpack_security_daily",
						"available": true,
						"cost_display": "100.00 USD",
						"cost": 100,
						"currency_code": "USD",
					},
					"jetpack_backup_daily": {
						"product_slug": "jetpack_backup_daily",
						"available": true,
						"cost": 100,
						"currency_code": "USD",
					},
					"jetpack_anti_spam": {
						"product_slug": "jetpack_anti_spam",
						"available": true,
						"cost_display": "100.00 USD",
						"cost": 100,
						"currency_code": "USD",
					},
					"jetpack_search": {
						"product_slug": "jetpack_search",
						"available": true,
						"cost": 100,
						"currency_code": "USD",
					},
				},
				"requests": {
					"isFetching": false
				}
			},
			siteData: {
				data: {
					plan: {
						product_slug: 'jetpack_free',
					},
					sitePurchases: [],
				},
				requests: {
					isFetchingSiteData: false,
					isFetchingSiteFeatures: false,
					isFetchingSitePlans: false,
					isFetchingSitePurchases: false,
				},
			},
			settings: {
				items: [],
			},
		},
	};
}
