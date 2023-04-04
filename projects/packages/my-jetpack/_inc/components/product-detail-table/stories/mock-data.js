export const boostProductData = {
	slug: 'boost',
	name: 'Boost',
	title: 'Jepack Boost',
	description: 'The easiest speed optimization plugin for WordPress',
	long_description:
		'Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required.',
	status: 'inactive',
	features: [
		'Check your site performance',
		'Enable improvements in one click',
		'Standalone free plugin for those focused on speed',
	],
	tiers: [ 'upgraded', 'free' ],
	featuresByTier: [
		{
			name: 'Optimize CSS Loading',
			info: {
				content:
					'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as Critical CSS.',
			},
			tiers: {
				free: {
					included: false,
					description: 'Manual Critical CSS regeneration',
				},
				upgraded: {
					included: true,
					description: 'Automatic Critical CSS regeneration',
				},
			},
		},
		{
			name: 'Defer non-essential JavaScript',
			info: {
				content:
					'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly.',
				link: {
					id: 'jetpack-boost-defer-js',
					title: 'dev.to',
				},
			},
			tiers: {
				free: {
					included: true,
				},
				upgraded: {
					included: true,
				},
			},
		},
		{
			name: 'Lazy image loading',
			info: {
				content: 'Improve page loading speed by only loading images when they are required.',
				link: {
					id: 'jetpack-boost-lazy-load',
					title: 'dev.to',
				},
			},
			tiers: {
				free: {
					included: true,
				},
				upgraded: {
					included: true,
				},
			},
		},
		{
			name: 'Dedicated support',
			info: {
				content:
					'Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue. All other questions are handled by our team as quickly as we are able to go through the WordPress support forum.',
			},
			tiers: {
				free: {
					included: false,
					description: 'No dedicated support',
				},
				upgraded: {
					included: true,
				},
			},
		},
	],
	pricingForUi: {
		tiers: {
			free: {
				available: true,
				isFree: true,
			},
			upgraded: {
				available: true,
				wpcomProductSlug: 'jetpack_boost',
				currencyCode: 'USD',
				fullPrice: 240,
				discountPrice: 240,
			},
		},
	},
};

export const protectProductData = {
	slug: 'protect',
	name: 'Protect',
	title: 'Jepack Protect',
	description: 'Stay one step ahead of threats',
	long_description:
		'Automatic scanning and one-click fixes keep your site one step ahead of security threats and malware.',
	status: 'inactive',
	features: [
		'Automated daily scanning',
		'One-click fixes for most issues',
		'Instant email notifications',
		'Access to latest Firewall rules',
	],
	pricingForUi: {
		tiers: {
			free: {
				available: true,
				isFree: true,
			},
			upgraded: {
				available: true,
				wpcomProductSlug: 'jetpack_scan',
				currencyCode: 'USD',
				fullPrice: 120,
				discountPrice: 60,
			},
		},
	},
	tiers: [ 'upgraded', 'free' ],
	featuresByTier: [
		{
			name: 'Scan for threats and vulnerabilities',
			tiers: {
				free: {
					included: true,
					description: 'Check items against database',
				},
				upgraded: {
					included: true,
					description: 'Line by line malware scanning',
				},
			},
		},
		{
			name: 'Daily automated scans',
			tiers: {
				free: {
					included: true,
				},
				upgraded: {
					included: true,
					description: 'Plus on-demand manual scans',
				},
			},
		},
		{
			name: 'Access to scan on Cloud',
			tiers: {
				free: {
					included: false,
				},
				upgraded: {
					included: true,
				},
			},
		},
		{
			name: 'One-click auto fixes',
			tiers: {
				free: {
					included: false,
				},
				upgraded: {
					included: true,
				},
			},
		},
		{
			name: 'Notifications',
			tiers: {
				free: {
					included: false,
				},
				upgraded: {
					included: true,
				},
			},
		},
		{
			name: 'Severity labels',
			tiers: {
				free: {
					included: false,
				},
				upgraded: {
					included: true,
				},
			},
		},
	],
};

export const socialProductData = {
	slug: 'social',
	name: 'Social',
	title: 'Jepack Social',
	description: 'Reach your audience on social media',
	long_description:
		'Promote your content on social media by automatically publishing when you publish on your site.',
	status: 'inactive',
	features: [
		'Post to social networks',
		'Schedule publishing',
		'Supports the major social networks',
	],
	tiers: [ 'advanced', 'basic', 'free' ],
	featuresByTier: [
		{
			name: 'Number of shares in 30 days',
			tiers: {
				free: {
					included: true,
					description: 'Up to 30',
				},
				basic: {
					included: true,
					struck_description: 'Up to 1,000',
					description: 'Unlimited',
					info: {
						title: 'Unlimited shares',
						content:
							'We are working on exciting new features for Jetpack Social. In the meantime, enjoy unlimited shares for a limited time!',
					},
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Priority support',
			tiers: {
				free: {
					included: false,
				},
				basic: {
					included: true,
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Schedule posting',
			tiers: {
				free: {
					included: true,
				},
				basic: {
					included: true,
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Twitter, Facebook, LinkedIn & Tumblr',
			tiers: {
				free: {
					included: true,
				},
				basic: {
					included: true,
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Customize publications',
			tiers: {
				free: {
					included: true,
				},
				basic: {
					included: true,
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Recycle content',
			info: {
				content: 'Repurpose, reuse or republish already published content.',
			},
			tiers: {
				free: {
					included: true,
				},
				basic: {
					included: true,
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Engagement optimizer',
			info: {
				content: 'Enhance social media engagement with personalized posts.',
			},
			tiers: {
				free: {
					included: false,
				},
				basic: {
					included: false,
				},
				advanced: {
					included: true,
				},
			},
		},
		{
			name: 'Video sharing',
			info: {
				title: 'Coming soon',
				content: 'Upload and share videos to your social platforms.',
			},
			tiers: {
				free: {
					included: false,
				},
				basic: {
					included: false,
				},
				advanced: {
					included: true,
					description: 'Coming soon',
				},
			},
		},
		{
			name: 'Multi-image sharing',
			info: {
				title: 'Coming soon',
				content: 'Share multiple images at once on social media platforms.',
			},
			tiers: {
				free: {
					included: false,
				},
				basic: {
					included: false,
				},
				advanced: {
					included: true,
					description: 'Coming soon',
				},
			},
		},
		{
			name: 'Image generator',
			info: {
				title: 'Coming soon',
				content: 'Automatically create custom images, saving you hours of tedious work.',
			},
			tiers: {
				free: {
					included: false,
				},
				basic: {
					included: false,
				},
				advanced: {
					included: true,
					description: 'Coming soon',
				},
			},
		},
	],
	pricingForUi: {
		tiers: {
			free: {
				available: true,
				isFree: true,
			},
			basic: {
				available: true,
				wpcomProductSlug: 'jetpack_social_basic_yearly',
				callToAction: 'Get Basic plan',
				currencyCode: 'USD',
				fullPrice: 120,
				discountPrice: 12,
				isIntroductoryOffer: true,
				introductoryOffer: {
					intervalUnit: 'month',
					intervalCount: 1,
					usageLimit: 0,
					costPerInterval: 12,
					transitionAfterRenewalCount: 0,
					shouldProrateWhenOfferEnds: false,
				},
			},
			advanced: {
				available: true,
				wpcomProductSlug: 'jetpack_social_advanced_yearly',
				callToAction: 'Get Advanced plan',
				currencyCode: 'USD',
				fullPrice: 180,
				discountPrice: 12,
				isIntroductoryOffer: true,
				introductoryOffer: {
					intervalUnit: 'month',
					intervalCount: 1,
					usageLimit: 0,
					costPerInterval: 12,
					transitionAfterRenewalCount: 0,
					shouldProrateWhenOfferEnds: false,
				},
			},
		},
	},
};
