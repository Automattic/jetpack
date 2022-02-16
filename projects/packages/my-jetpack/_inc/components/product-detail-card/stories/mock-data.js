export const antiSpamProductData = {
	slug: 'anti-spam',
	name: 'Anti-Spam',
	title: 'Jepack Anti-Spam',
	description: 'Stop comment and form spam',
	is_upgradable_by_bundle: [ 'security' ],
	long_description:
		'Save time and get better responses by automatically blocking spam from your comments and forms.',
	status: 'active',
	features: [
		'Comment and form spam protection',
		'Powered by Akismet',
		'Block spam without CAPTCHAs',
		'Advanced stats',
	],
	pricingForUi: {
		available: true,
		currencyCode: 'EUR',
		fullPrice: 9.92,
		promotionPercentage: 50,
	},
};

export const backupProductData = {
	slug: 'backup',
	name: 'Backup',
	title: 'Jepack Backup',
	description: 'Save every change',
	is_upgradable_by_bundle: [ 'security' ],
	long_description:
		'Never lose a word, image, page, or time worrying about your site with automated backups & one-click restores.',
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
		fullPrice: 9,
		promotionPercentage: 50,
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

export const crmProductData = {
	slug: 'crm',
	name: 'CRM',
	title: 'Jetpack CRM',
	description: 'Connect with your people',
	long_description:
		'All of your contacts in one place. Build better relationships with your customers and clients.',
	status: 'inactive',
	features: [
		'Manage unlimited contacts',
		'Manage billing and create invoices',
		'Fully integrated with WordPress & WooCommerce',
		'Infinitely customizable with integrations and extensions',
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
	is_upgradable_by_bundle: [ 'security' ],
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
		discount: 50,
	},
};

export const searchProductData = {
	slug: 'search',
	name: 'Search',
	title: 'Jetpack Site Search',
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
		discount: 50,
	},
};

export const securityProductData = {
	slug: 'security',
	name: 'Security',
	title: 'Security',
	description: 'Comprehensive site security, including Backup, Scan, and Anti-spam.',
	long_description: 'Comprehensive site security, including Backup, Scan, and Anti-spam.',
	status: 'inactive',
	is_bundle: true,
	supportedProducts: [ 'backup', 'scan', 'anti-spam' ],
	features: [
		'Real-time cloud backups with 10GB storage',
		'Automated real-time malware scan',
		'One-click fixes for most threats',
		'Comment & form spam protection',
	],
	pricingForUi: {
		available: true,
		show_promotion: true,
		full_price: 24.92,
		discount: 50,
	},
};

export const videoPressProductData = {
	slug: 'videopress',
	name: 'VideoPress',
	title: 'Jetpack Site VideoPress',
	description: 'High quality, ad-free video',
	long_description: 'High-quality, ad-free video built specifically for WordPress.',
	status: 'inactive',
	features: [
		'1TB of storage',
		'Built into WordPress editor',
		'Ad-free and brandable player',
		'Unlimited users',
	],
	pricingForUi: {
		available: true,
		currencyCode: 'USD',
		fullPrice: 119,
		promotionPercentage: 50,
	},
};
