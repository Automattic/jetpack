export const jetpackProtectInitialState = {
	apiRoot: 'http://localhost/wp-json/',
	apiNonce: 'f2d2d42e2a',
	registrationNonce: 'c923ca109f',
	status: {
		last_checked: '2022-05-05 20:56:27',
		num_threats: 6,
		num_plugins_threats: 3,
		num_themes_threats: 3,
		status: 'scheduled',
		wordpress: {
			version: '5.9.3',
			threats: [],
		},
		themes: {
			twentynineteen: {
				version: '2.2',
				threats: [
					{
						id: '1fd6742e-1a32-446d-be3d-7cce44f8f416',
						title: 'Sample Threat number 1 with a long title',
						fixed_in: '3.14.2',
					},
				],
			},
			twentytwenty: {
				version: '1.9',
				threats: [
					{
						id: '1ac912c1-5e29-41ac-8f76-a062de254c09',
						title: 'Sample Threat number 1 with a long title',
						fixed_in: '3.14.2',
					},
					{
						id: '6e61b246-5af1-4a4f-9ca8-a8c87eb2e499',
						title: 'Sample Threat number 2 with a long title',
						fixed_in: '3.14.2',
					},
				],
			},
			twentytwentyone: {
				version: '1.5',
				threats: [],
			},
			twentytwentytwo: {
				version: '1.1',
				threats: [],
			},
		},
		plugins: {
			'akismet/akismet.php': {
				version: '4.2.3',
				threats: [
					{
						id: '36e3817f-7fcc-4a97-9ea2-e5e3b01f93a1',
						title: 'Sample Threat number 1 with a long title',
						fixed_in: '3.14.2',
					},
				],
			},
			'always-use-jetpack-open-graph/always-use-jetpack-open-graph.php': {
				version: '1.0.2-alpha',
				threats: [
					{
						id: 'd442acac-4394-45e4-b6bb-adf4a40960fb',
						title: 'Sample Threat number 1 with a long title',
						fixed_in: '3.14.2',
					},
					{
						id: '0c980e1c-d4dc-4b96-b0ce-282289674f55',
						title: 'Sample Threat number 2 with a long title',
						fixed_in: '3.14.2',
					},
				],
			},
			'core-control/core-control.php': {
				version: '1.2.1',
				threats: [],
			},
			'creative-mail-by-constant-contact/creative-mail-plugin.php': {
				version: '1.4.9',
				threats: [],
			},
			'gutenberg/gutenberg.php': {
				version: '12.7.1',
				threats: [],
			},
			'jetpack/jetpack.php': {
				version: '11.0-a.2',
				threats: [],
			},
			'backup/jetpack-backup.php': {
				version: '1.3.0-alpha',
				threats: [],
			},
			'beta/jetpack-beta.php': {
				version: '3.1.2-alpha',
				threats: [],
			},
			'boost/jetpack-boost.php': {
				version: '1.4.3-alpha',
				threats: [],
			},
			'jetpack-boost/jetpack-boost.php': {
				version: '1.4.0',
				threats: [],
			},
			'zero-bs-crm/ZeroBSCRM.php': {
				version: '4.9.0',
				threats: [],
			},
			'debug-helper/plugin.php': {
				version: '1.4.0-alpha',
				threats: [],
			},
			'protect/jetpack-protect.php': {
				version: '0.1.0-alpha',
				threats: [],
			},
			'search/jetpack-search.php': {
				version: '0.1.0-alpha',
				threats: [],
			},
			'social/jetpack-social.php': {
				version: '0.1.0-alpha',
				threats: [],
			},
			'starter-plugin/jetpack-starter-plugin.php': {
				version: '0.1.0-alpha',
				threats: [],
			},
			'qr-block/qr-block.php': {
				version: '0.0.10',
				threats: [],
			},
			'query-monitor/query-monitor.php': {
				version: '3.8.2',
				threats: [],
			},
			'vaultpress/vaultpress.php': {
				version: '2.2.2-alpha',
				threats: [],
			},
			'wp-crontrol/wp-crontrol.php': {
				version: '1.12.0',
				threats: [],
			},
		},
	},
	installedPlugins: {
		'akismet/akismet.php': {
			Name: 'Akismet Anti-Spam',
			PluginURI: 'https://akismet.com/',
			Version: '4.2.3',
			Description:
				'Used by millions, Akismet is quite possibly the best way in the world to <strong>protect your blog from spam</strong>. Your site is fully configured and being protected, even while you sleep.',
			Author: 'Automattic',
			AuthorURI: 'https://automattic.com/wordpress-plugins/',
			TextDomain: 'akismet',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Akismet Anti-Spam',
			AuthorName: 'Automattic',
			active: true,
		},
		'always-use-jetpack-open-graph/always-use-jetpack-open-graph.php': {
			Name: 'Always Use Open Graph with Jetpack',
			PluginURI: 'https://kraft.blog/',
			Version: '1.0.2-alpha',
			Description:
				"Jetpack automatically disables its Open Graph tags when there's a known plugin that already adds Open Graph tags, which is good. Sometimes, though, you might want to use Jetpack's version instead. Even if you disable the tags in the conflicting plugin, Jetpack won't add Open Graph tags without being told to do so.",
			Author: 'Brandon Kraft',
			AuthorURI: '',
			TextDomain: 'always-use-jetpack-open-graph',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Always Use Open Graph with Jetpack',
			AuthorName: 'Brandon Kraft',
			active: false,
		},
		'core-control/core-control.php': {
			Name: 'Core Control',
			PluginURI: 'https://dd32.id.au/wordpress-plugins/core-control/',
			Version: '1.2.1',
			Description:
				'Core Control is a set of plugin modules which can be used to control certain aspects of the WordPress control.',
			Author: 'Dion Hulse',
			AuthorURI: 'https://dd32.id.au/',
			TextDomain: 'core-control',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Core Control',
			AuthorName: 'Dion Hulse',
			active: false,
		},
		'creative-mail-by-constant-contact/creative-mail-plugin.php': {
			Name: 'Creative Mail by Constant Contact',
			PluginURI: 'https://wordpress.org/plugins/creative-mail-by-constant-contact/',
			Version: '1.4.9',
			Description:
				'Free email marketing designed specifically for WordPress, Jetpack and WooCommerce. Send newsletters, promotions, updates and transactional e-commerce emails. Simple and easy, powered by Constant Contact’s rock solid reliability.',
			Author: 'Constant Contact',
			AuthorURI: 'https://www.constantcontact.com',
			TextDomain: 'creative-mail-by-constant-contact',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Creative Mail by Constant Contact',
			AuthorName: 'Constant Contact',
			active: false,
		},
		'gutenberg/gutenberg.php': {
			Name: 'Gutenberg',
			PluginURI: 'https://github.com/WordPress/gutenberg',
			Version: '12.7.1',
			Description:
				'Printing since 1440. This is the development plugin for the new block editor in core.',
			Author: 'Gutenberg Team',
			AuthorURI: '',
			TextDomain: 'gutenberg',
			DomainPath: '',
			Network: false,
			RequiresWP: '5.8',
			RequiresPHP: '5.6',
			UpdateURI: '',
			Title: 'Gutenberg',
			AuthorName: 'Gutenberg Team',
			active: false,
		},
		'jetpack/jetpack.php': {
			Name: 'Jetpack',
			PluginURI: 'https://jetpack.com',
			Version: '11.0-a.2',
			Description:
				'Security, performance, and marketing tools made by WordPress experts. Jetpack keeps your site protected so you can focus on more important things.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com',
			TextDomain: 'jetpack',
			DomainPath: '',
			Network: false,
			RequiresWP: '5.9',
			RequiresPHP: '5.6',
			UpdateURI: '',
			Title: 'Jetpack',
			AuthorName: 'Automattic',
			active: false,
		},
		'backup/jetpack-backup.php': {
			Name: 'Jetpack Backup',
			PluginURI: 'https://jetpack.com/jetpack-backup',
			Version: '1.3.0-alpha',
			Description:
				'Easily restore or download a backup of your site from a specific moment in time.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com/',
			TextDomain: 'jetpack-backup',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Jetpack Backup',
			AuthorName: 'Automattic',
			active: true,
		},
		'beta/jetpack-beta.php': {
			Name: 'Jetpack Beta Tester',
			PluginURI: 'https://jetpack.com/beta/',
			Version: '3.1.2-alpha',
			Description:
				'Use the Beta plugin to get a sneak peek at new features and test them on your site.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com/',
			TextDomain: 'jetpack-beta',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: 'https://jetpack.com/download-jetpack-beta/',
			Title: 'Jetpack Beta Tester',
			AuthorName: 'Automattic',
			active: false,
		},
		'boost/jetpack-boost.php': {
			Name: 'Jetpack Boost',
			PluginURI: 'https://jetpack.com/boost',
			Version: '1.4.3-alpha',
			Description: "Boost your WordPress site's performance, from the creators of Jetpack",
			Author: 'Automattic - Website Speed and Performance team',
			AuthorURI: 'https://automattic.com',
			TextDomain: 'jetpack-boost',
			DomainPath: '/languages',
			Network: false,
			RequiresWP: '5.5',
			RequiresPHP: '7.0',
			UpdateURI: '',
			Title: 'Jetpack Boost',
			AuthorName: 'Automattic - Website Speed and Performance team',
			active: false,
		},
		'jetpack-boost/jetpack-boost.php': {
			Name: 'Jetpack Boost',
			PluginURI: 'https://jetpack.com/boost',
			Version: '1.4.0',
			Description: "Boost your WordPress site's performance, from the creators of Jetpack",
			Author: 'Automattic',
			AuthorURI: 'https://automattic.com',
			TextDomain: 'jetpack-boost',
			DomainPath: '/languages',
			Network: false,
			RequiresWP: '5.5',
			RequiresPHP: '7.0',
			UpdateURI: '',
			Title: 'Jetpack Boost',
			AuthorName: 'Automattic',
			active: true,
		},
		'zero-bs-crm/ZeroBSCRM.php': {
			Name: 'Jetpack CRM',
			PluginURI: 'https://jetpackcrm.com',
			Version: '4.9.0',
			Description:
				'Jetpack CRM is the simplest CRM for WordPress. Self host your own Customer Relationship Manager using WP.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpackcrm.com',
			TextDomain: 'zero-bs-crm',
			DomainPath: '',
			Network: false,
			RequiresWP: '5.0',
			RequiresPHP: '5.6',
			UpdateURI: '',
			Title: 'Jetpack CRM',
			AuthorName: 'Automattic',
			active: false,
		},
		'debug-helper/plugin.php': {
			Name: 'Jetpack Debug Tools',
			PluginURI: '',
			Version: '1.4.0-alpha',
			Description: "Give me a Jetpack connection, and I'll break it every way possible.",
			Author: 'Automattic - Jetpack Crew',
			AuthorURI: '',
			TextDomain: 'jetpack',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Jetpack Debug Tools',
			AuthorName: 'Automattic - Jetpack Crew',
			active: false,
		},
		'protect/jetpack-protect.php': {
			Name: 'Jetpack Protect',
			PluginURI: 'https://wordpress.org/plugins/jetpack-protect',
			Version: '0.1.0-alpha',
			Description: 'Security tools that keep your site safe and sound, from posts to plugins.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com/',
			TextDomain: 'jetpack-protect',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Jetpack Protect',
			AuthorName: 'Automattic',
			active: true,
		},
		'search/jetpack-search.php': {
			Name: 'Jetpack Search',
			PluginURI: 'https://jetpack.com/search/',
			Version: '0.1.0-alpha',
			Description: "A cloud-powered replacement for WordPress' search.",
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com/',
			TextDomain: 'jetpack-search',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Jetpack Search',
			AuthorName: 'Automattic',
			active: false,
		},
		'social/jetpack-social.php': {
			Name: 'Jetpack Social',
			PluginURI: 'https://wordpress.org/plugins/jetpack-social',
			Version: '0.1.0-alpha',
			Description:
				'Share your site’s posts on several social media networks automatically when you publish a new post.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com/',
			TextDomain: 'jetpack-social',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Jetpack Social',
			AuthorName: 'Automattic',
			active: true,
		},
		'starter-plugin/jetpack-starter-plugin.php': {
			Name: 'Jetpack Starter Plugin',
			PluginURI: 'https://wordpress.org/plugins/jetpack-starter-plugin',
			Version: '0.1.0-alpha',
			Description: 'plugin--description.',
			Author: 'Automattic',
			AuthorURI: 'https://jetpack.com/',
			TextDomain: 'jetpack-starter-plugin',
			DomainPath: '',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'Jetpack Starter Plugin',
			AuthorName: 'Automattic',
			active: false,
		},
		'qr-block/qr-block.php': {
			Name: 'QR Block',
			PluginURI: '',
			Version: '0.0.10',
			Description: 'Another amazing QR Code block for Gutenberg.',
			Author: 'retrofox',
			AuthorURI: '',
			TextDomain: 'qr-block',
			DomainPath: '',
			Network: false,
			RequiresWP: '5.8',
			RequiresPHP: '7.0',
			UpdateURI: '',
			Title: 'QR Block',
			AuthorName: 'retrofox',
			active: false,
		},
		'query-monitor/query-monitor.php': {
			Name: 'Query Monitor',
			PluginURI: 'https://querymonitor.com/',
			Version: '3.8.2',
			Description: 'The Developer Tools Panel for WordPress.',
			Author: 'John Blackbourn',
			AuthorURI: 'https://querymonitor.com/',
			TextDomain: 'query-monitor',
			DomainPath: '/languages/',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '5.3.6',
			UpdateURI: '',
			Title: 'Query Monitor',
			AuthorName: 'John Blackbourn',
			active: false,
		},
		'vaultpress/vaultpress.php': {
			Name: 'VaultPress',
			PluginURI:
				'http://vaultpress.com/?utm_source=plugin-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0',
			Version: '2.2.2-alpha',
			Description:
				'Protect your content, themes, plugins, and settings with <strong>realtime backup</strong> and <strong>automated security scanning</strong> from <a href="http://vaultpress.com/?utm_source=wp-admin&amp;utm_medium=plugin-description&amp;utm_campaign=1.0" rel="nofollow">VaultPress</a>. Activate, enter your registration key, and never worry again. <a href="http://vaultpress.com/help/?utm_source=wp-admin&amp;utm_medium=plugin-description&amp;utm_campaign=1.0" rel="nofollow">Need some help?</a>',
			Author: 'Automattic',
			AuthorURI:
				'http://vaultpress.com/?utm_source=author-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0',
			TextDomain: 'vaultpress',
			DomainPath: '/languages/',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '',
			UpdateURI: '',
			Title: 'VaultPress',
			AuthorName: 'Automattic',
			active: false,
		},
		'wp-crontrol/wp-crontrol.php': {
			Name: 'WP Crontrol',
			PluginURI: 'https://wordpress.org/plugins/wp-crontrol/',
			Version: '1.12.0',
			Description:
				"WP Crontrol enables you to view and control what's happening in the WP-Cron system.",
			Author: 'John Blackbourn & crontributors',
			AuthorURI: 'https://github.com/johnbillion/wp-crontrol/graphs/contributors',
			TextDomain: 'wp-crontrol',
			DomainPath: '/languages/',
			Network: false,
			RequiresWP: '',
			RequiresPHP: '5.3.6',
			UpdateURI: '',
			Title: 'WP Crontrol',
			AuthorName: 'John Blackbourn & crontributors',
			active: true,
		},
	},
	installedThemes: {
		twentynineteen: {
			Name: 'Twenty Nineteen',
			ThemeURI: 'https://wordpress.org/themes/twentynineteen/',
			Author: 'the WordPress team',
			Version: '2.2',
			Template: '',
			Status: 'publish',
			TextDomain: 'twentynineteen',
			RequiresWP: '4.9.6',
			RequiresPHP: '5.2.4',
			active: false,
			is_block_theme: false,
		},
		twentytwenty: {
			Name: 'Twenty Twenty',
			ThemeURI: 'https://wordpress.org/themes/twentytwenty/',
			Author: 'the WordPress team',
			Version: '1.9',
			Template: '',
			Status: 'publish',
			TextDomain: 'twentytwenty',
			RequiresWP: '4.7',
			RequiresPHP: '5.2.4',
			active: false,
			is_block_theme: false,
		},
		twentytwentyone: {
			Name: 'Twenty Twenty-One',
			ThemeURI: 'https://wordpress.org/themes/twentytwentyone/',
			Author: 'the WordPress team',
			Version: '1.5',
			Template: '',
			Status: 'publish',
			TextDomain: 'twentytwentyone',
			RequiresWP: '5.3',
			RequiresPHP: '5.6',
			active: false,
			is_block_theme: false,
		},
		twentytwentytwo: {
			Name: 'Twenty Twenty-Two',
			ThemeURI: 'https://wordpress.org/themes/twentytwentytwo/',
			Author: 'the WordPress team',
			Version: '1.1',
			Template: '',
			Status: 'publish',
			TextDomain: 'twentytwentytwo',
			RequiresWP: '5.9',
			RequiresPHP: '5.6',
			active: true,
			is_block_theme: true,
		},
	},
	wpVersion: '5.9.3',
	adminUrl: 'http://localhost/wp-admin/admin.php?page=jetpack-protect',
	securityBundle: {
		slug: 'security',
		name: 'Security',
		title: 'Security',
		description: 'Comprehensive site security, including Backup, Scan, and Anti-spam.',
		long_description: 'Comprehensive site security, including Backup, Scan, and Anti-spam.',
		features: [
			'Real-time cloud backups with 10GB storage',
			'Automated real-time malware scan',
			'One-click fixes for most threats',
			'Comment & form spam protection',
		],
		status: 'needs_purchase',
		pricing_for_ui: {
			available: true,
			wpcom_product_slug: 'jetpack_security_t1_yearly',
			currency_code: 'USD',
			full_price: 299.4,
			discount_price: 107.4,
		},
		is_bundle: true,
		is_upgradable_by_bundle: false,
		supported_products: [ 'backup', 'scan', 'anti-spam' ],
		wpcom_product_slug: 'jetpack_security_t1_yearly',
		requires_user_connection: true,
		has_required_plan: false,
		manage_url: '',
		post_activation_url: '',
		class: 'Automattic\\Jetpack\\My_Jetpack\\Products\\Security',
	},
	productData: {
		slug: 'protect',
		name: 'Protect',
		title: 'Jetpack Protect',
		description: 'Protect your site and scan for security vulnerabilities.',
		longDescription:
			'Protect your site and scan for security vulnerabilities listed in our database.',
		features: [
			'Over 20,000 listed vulnerabilities',
			'Daily automatic scans',
			'Check plugin and theme version status',
			'Easy to navigate and use',
		],
		status: 'active',
		pricingForUi: {
			available: true,
			isFree: true,
		},
		isBundle: false,
		isUpgradableByBundle: false,
		supportedProducts: [],
		wpcomProductSlug: null,
		requiresUserConnection: false,
		hasRequiredPlan: true,
		manageUrl: 'http://localhost/wp-admin/admin.php?page=jetpack-protect',
		postActivationUrl: 'http://localhost/wp-admin/admin.php?page=jetpack-protect',
		class: 'Automattic\\Jetpack\\My_Jetpack\\Products\\Protect',
	},
};
