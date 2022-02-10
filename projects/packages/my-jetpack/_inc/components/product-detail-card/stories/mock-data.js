export const backupProductData = {
	slug: 'backup',
	name: 'Backup',
	title: 'Jepack Backup',
	description: 'Save every change',
	long_description:
		'Real-time backups save every change and one-click restores get you back online quickly.',
	status: 'active',
	features: [
		'Real-time cloud backups',
		'10GB of backup storage',
		'30-day archive & activity log',
		'One-click restores',
	],
	pricingForUi: {
		available: true,
		currencyCode: 'EUR',
		fullPrice: '9',
		promotionPercentage: '50',
	},
};

export const boostProductData = {
	slug: 'boost',
	name: 'Boost',
	title: 'Jepack Boost',
	description: 'Instant speed and SEO',
	long_description:
		'Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required.',
	status: 'inactive',
	features: [
		'Check your site performance',
		'Enable improvements in one click',
		'Standalone free plugin for those focused on speed',
	],
	pricingForUi: {
		available: true,
		is_free: true,
	},
};

export const scanProductData = {
	slug: 'scan',
	name: 'Scan',
	title: 'Jepack Scan',
	description: 'Stay one step ahead of threats',
	long_description:
		'Automatic scanning and one-click fixes keep your site one step ahead of security threats and malware.',
	status: 'inactive',
	features: [
		'Automated daily scanning',
		'One-click fixes for most issues',
		'Instant email notifications',
	],
	pricingForUi: {
		available: true,
		currency_code: 'USD',
		full_price: 9.92,
		promotion_percentage: 50,
	},
};

export const searchProductData = {
	slug: 'search',
	name: 'Search',
	title: 'Jepack Search',
	description: 'Help them find what they need',
	long_description:
		'Help your site visitors find answers instantly so they keep reading and buying. Great for sites with a lot of content.',
	status: 'inactive',
	features: [
		'Instant search and indexing',
		'Powerful filtering',
		'Supports 29 languages',
		'Spelling correction',
	],
	pricingForUi: {
		available: true,
		currency_code: 'EUR',
		full_price: 4.5,
		promotion_percentage: 50,
	},
};
