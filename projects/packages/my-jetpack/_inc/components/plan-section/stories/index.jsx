/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import PlanSection from '../index.jsx';

export default {
	title: 'My Jetpack/Plan Section',
	component: PlanSection,
	decorators: [ withMock ],
	argTypes: {
		logoColor: { control: 'color' },
	},
};

const Template = args => <PlanSection { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );

const siteWithSecurityPlanResponseBody = {
	ID: 12345678,
	name: 'My awesome Jetpack mock site',
	description: 'Just another mocking WordPress site',
	URL: 'https://mock-site.com',
	capabilities: {
		edit_pages: true,
		edit_posts: true,
		edit_others_posts: true,
		edit_others_pages: true,
		delete_posts: true,
		delete_others_posts: true,
		edit_theme_options: true,
		edit_users: true,
		list_users: true,
		manage_categories: true,
		manage_options: true,
		moderate_comments: true,
		activate_wordads: true,
		promote_users: true,
		publish_posts: true,
		upload_files: true,
		delete_users: false,
		remove_users: true,
		own_site: true,
		view_hosting: false,
		view_stats: true,
		activate_plugins: true,
	},
	jetpack: true,
	jetpack_connection: true,
	is_multisite: false,
	post_count: 1,
	subscribers_count: 1,
	locale: 'en-US',
	logo: {
		id: 0,
		sizes: [],
		url: '',
	},
	visible: true,
	is_private: false,
	is_coming_soon: false,
	single_user_site: true,
	is_vip: false,
	is_following: false,
	options: {
		timezone: '',
		gmt_offset: 0,
		blog_public: 0,
		videopress_enabled: false,
		upgraded_filetypes_enabled: true,
		login_url: 'https://mock-site.com/wp-login.php',
		admin_url: 'https://mock-site.com/wp-admin/',
		is_mapped_domain: true,
		is_redirect: false,
		unmapped_url: 'https://mock-site.com',
		featured_images_enabled: true,
		theme_slug: 'twentytwentyone',
		header_image: false,
		background_color: false,
		image_default_link_type: 'none',
		image_thumbnail_width: 150,
		image_thumbnail_height: 150,
		image_thumbnail_crop: '1',
		image_medium_width: 300,
		image_medium_height: 300,
		image_large_width: 1024,
		image_large_height: 1024,
		permalink_structure: '/%year%/%monthnum%/%day%/%postname%/',
		post_formats: {
			link: 'Link',
			aside: 'Aside',
			gallery: 'Gallery',
			image: 'Image',
			quote: 'Quote',
			status: 'Status',
			video: 'Video',
			audio: 'Audio',
			chat: 'Chat',
		},
		default_post_format: '0',
		default_category: 1,
		allowed_file_types: [
			'jpg',
			'jpeg',
			'jpe',
			'gif',
			'png',
			'bmp',
			'tiff',
			'tif',
			'webp',
			'ico',
			'asf',
			'asx',
			'wmv',
			'wmx',
			'wm',
			'avi',
			'divx',
			'flv',
			'mov',
			'qt',
			'mpeg',
			'mpg',
			'mpe',
			'mp4',
			'm4v',
			'ogv',
			'webm',
			'mkv',
			'3gp',
			'3gpp',
			'3g2',
			'3gp2',
			'txt',
			'asc',
			'c',
			'cc',
			'h',
			'srt',
			'csv',
			'tsv',
			'ics',
			'rtx',
			'css',
			'htm',
			'html',
			'vtt',
			'dfxp',
			'mp3',
			'm4a',
			'm4b',
			'aac',
			'ra',
			'ram',
			'wav',
			'ogg',
			'oga',
			'flac',
			'mid',
			'midi',
			'wma',
			'wax',
			'mka',
			'rtf',
			'js',
			'pdf',
			'class',
			'tar',
			'zip',
			'gz',
			'gzip',
			'rar',
			'7z',
			'psd',
			'xcf',
			'doc',
			'pot',
			'pps',
			'ppt',
			'wri',
			'xla',
			'xls',
			'xlt',
			'xlw',
			'mdb',
			'mpp',
			'docx',
			'docm',
			'dotx',
			'dotm',
			'xlsx',
			'xlsm',
			'xlsb',
			'xltx',
			'xltm',
			'xlam',
			'pptx',
			'pptm',
			'ppsx',
			'ppsm',
			'potx',
			'potm',
			'ppam',
			'sldx',
			'sldm',
			'onetoc',
			'onetoc2',
			'onetmp',
			'onepkg',
			'oxps',
			'xps',
			'odt',
			'odp',
			'ods',
			'odg',
			'odc',
			'odb',
			'odf',
			'wp',
			'wpd',
			'key',
			'numbers',
			'pages',
		],
		show_on_front: 'posts',
		default_likes_enabled: true,
		default_sharing_status: false,
		default_comment_status: true,
		default_ping_status: true,
		software_version: '5.8.3',
		created_at: '2020-06-02T18:40:08+00:00',
		wordads: false,
		publicize_permanently_disabled: false,
		frame_nonce: '4ded92cd30',
		jetpack_frame_nonce: '1642094436:1:22031e47ad0dcda69597621d1e1647a3',
		headstart: false,
		headstart_is_fresh: false,
		ak_vp_bundle_enabled: false,
		advanced_seo_front_page_description: '',
		advanced_seo_title_formats: [],
		verification_services_codes: '0',
		podcasting_archive: null,
		is_domain_only: false,
		is_automated_transfer: false,
		is_wpcom_atomic: false,
		is_wpcom_store: false,
		woocommerce_is_active: false,
		design_type: null,
		site_goals: null,
		site_segment: false,
		import_engine: null,
		is_wpforteams_site: false,
		p2_hub_blog_id: null,
		is_cloud_eligible: false,
		anchor_podcast: false,
		is_difm_lite_in_progress: false,
		site_intent: '',
		jetpack_version: '10.6-a.2',
		main_network_site: 'https://mock-site.com',
		active_modules: [
			'contact-form',
			'enhanced-distribution',
			'json-api',
			'stats',
			'verification-tools',
			'woocommerce-analytics',
			'notes',
			'protect',
		],
		max_upload_size: 67108864,
		wp_memory_limit: 41943040,
		wp_max_memory_limit: 268435456,
		is_multi_network: false,
		is_multi_site: false,
		file_mod_disabled: [ 'wp_auto_update_core_disabled' ],
		jetpack_connection_active_plugins: [ 'jetpack' ],
		editing_toolkit_is_active: false,
		is_pending_plan: false,
		videopress_storage_used: 0,
	},
	plan: {
		product_id: 2017,
		product_slug: 'jetpack_security_t1_monthly',
		product_name: 'Jetpack Security (10GB)',
		product_name_short: 'Security (10GB)',
		expired: false,
		billing_period: 'Monthly',
		user_is_owner: true,
		is_free: false,
		license_key: '',
		features: {
			active: [
				'google-analytics',
				'security-settings',
				'advanced-seo',
				'upload-video-files',
				'video-hosting',
				'wordads-jetpack',
				'akismet',
				'send-a-message',
				'whatsapp-button',
				'social-previews',
				'donations',
				'core/audio',
				'republicize',
				'premium-content/container',
				'support',
			],
			available: {
				'security-settings': [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'advanced-seo': [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'upload-video-files': [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				akismet: [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'send-a-message': [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'whatsapp-button': [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'social-previews': [
					'jetpack_free',
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'google-analytics': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'video-hosting': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'wordads-jetpack': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'vaultpress-backups': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				'vaultpress-backup-archive': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				'vaultpress-storage-space': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				'vaultpress-automated-restores': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				'simple-payments': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
				],
				calendly: [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				opentable: [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				donations: [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'core/video': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				'core/cover': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
				],
				'core/audio': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				republicize: [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'premium-content/container': [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				support: [
					'jetpack_premium',
					'jetpack_business',
					'jetpack_personal',
					'jetpack_premium_monthly',
					'jetpack_business_monthly',
					'jetpack_personal_monthly',
					'jetpack_security_daily',
					'jetpack_security_daily_monthly',
					'jetpack_security_realtime',
					'jetpack_security_realtime_monthly',
					'jetpack_complete',
					'jetpack_complete_monthly',
					'jetpack_security_t1_yearly',
					'jetpack_security_t2_yearly',
					'jetpack_security_t2_monthly',
				],
				'premium-themes': [ 'jetpack_business', 'jetpack_business_monthly' ],
				'vaultpress-security-scanning': [ 'jetpack_business', 'jetpack_business_monthly' ],
				polldaddy: [ 'jetpack_business', 'jetpack_business_monthly' ],
			},
		},
	},
	updates: {
		plugins: 0,
		themes: 0,
		wordpress: 0,
		translations: 0,
		total: 0,
	},
	jetpack_modules: [
		'contact-form',
		'enhanced-distribution',
		'json-api',
		'stats',
		'verification-tools',
		'woocommerce-analytics',
		'notes',
		'protect',
	],
	meta: {
		links: {
			self: 'https://public-api.wordpress.com/rest/v1.2/sites/12345678',
			help: 'https://public-api.wordpress.com/rest/v1.2/sites/12345678/help',
			posts: 'https://public-api.wordpress.com/rest/v1.2/sites/12345678/posts/',
			comments: 'https://public-api.wordpress.com/rest/v1.1/sites/12345678/comments/',
			xmlrpc: 'https://mock-site.com/xmlrpc.php',
		},
	},
	launch_status: '',
	is_fse_active: false,
	is_fse_eligible: false,
	is_core_site_editor_enabled: false,
	is_wpcom_atomic: false,
	site_migration: null,
	products: [
		{
			product_id: '2112',
			product_slug: 'jetpack_backup_t1_yearly',
			product_name: 'Jetpack Backup (10GB)',
			product_name_short: 'Backup (10GB)',
			product_type: 'jetpack',
			expired: false,
			user_is_owner: true,
		},
	],
	zendesk_site_meta: {
		plan: 'jp_security_tier_1',
		addon: [],
	},
};

_default.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site?_locale=user',
			method: 'GET',
			status: 200,
			response: siteWithSecurityPlanResponseBody,
		},
	],
};

_default.args = DefaultArgs;
