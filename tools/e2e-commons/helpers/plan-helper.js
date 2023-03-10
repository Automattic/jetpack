import fs from 'fs';
import { execWpCommand, resolveSiteUrl } from './utils-helper.cjs';
import logger from '../logger.cjs';
import config from 'config';
import path from 'path';

export async function persistPlanData( planType = 'jetpack_complete' ) {
	const planDataOption = 'e2e_jetpack_plan_data';
	const siteId = await getSiteId();
	const planData = getPlanData( siteId, resolveSiteUrl(), planType );
	const planDatafilePath = path.resolve( config.get( 'temp.planData' ) );

	fs.writeFileSync( planDatafilePath, JSON.stringify( planData ) );

	const cmd = `option update ${ planDataOption } < ${ planDatafilePath }`;
	await execWpCommand( cmd );
}

export async function activatePlanDataInterceptor() {
	return await execWpCommand( 'plugin activate e2e-plan-data-interceptor' );
}

async function getSiteId() {
	const output = await execWpCommand( 'jetpack options get id' );
	return output.split( ':' )[ 1 ].trim();
}

function getPlanData(
	id,
	siteUrl,
	planType,
	siteName = 'Whatever',
	description = 'Just another WordPress site'
) {
	const plan = getPlan( planType );
	return {
		ID: id,
		name: siteName,
		description,
		URL: siteUrl,
		user_can_manage: false,
		capabilities: {
			edit_pages: false,
			edit_posts: false,
			edit_others_posts: false,
			edit_others_pages: false,
			delete_posts: false,
			delete_others_posts: false,
			edit_theme_options: false,
			edit_users: false,
			list_users: false,
			manage_categories: false,
			manage_options: false,
			moderate_comments: false,
			activate_wordads: false,
			promote_users: false,
			publish_posts: false,
			upload_files: false,
			delete_users: false,
			remove_users: false,
			view_hosting: false,
			view_stats: false,
		},
		jetpack: true,
		is_multisite: false,
		subscribers_count: 2,
		lang: false,
		logo: { id: 0, sizes: [], url: '' },
		visible: null,
		is_private: false,
		single_user_site: false,
		is_vip: false,
		is_following: false,
		options: {
			timezone: '',
			gmt_offset: 3,
			blog_public: 1,
			videopress_enabled: false,
			upgraded_filetypes_enabled: true,
			login_url: `${ siteUrl }/wp-login.php`,
			admin_url: `${ siteUrl }/wp-admin/`,
			is_mapped_domain: true,
			is_redirect: false,
			unmapped_url: `${ siteUrl }`,
			featured_images_enabled: false,
			theme_slug: 'twentytwenty',
			header_image: false,
			background_color: false,
			image_default_link_type: '',
			image_thumbnail_width: 150,
			image_thumbnail_height: 150,
			image_thumbnail_crop: 0,
			image_medium_width: 300,
			image_medium_height: 300,
			image_large_width: 1024,
			image_large_height: 1024,
			permalink_structure: '/%year%/%monthnum%/%day%/%postname%/',
			post_formats: {
				aside: 'Aside',
				image: 'Image',
				video: 'Video',
				quote: 'Quote',
				link: 'Link',
				gallery: 'Gallery',
				audio: 'Audio',
			},
			default_post_format: '0',
			default_category: 1,
			allowed_file_types: [
				'jpg',
				'jpeg',
				'png',
				'gif',
				'pdf',
				'doc',
				'ppt',
				'odt',
				'pptx',
				'docx',
				'pps',
				'ppsx',
				'xls',
				'xlsx',
				'key',
				'asc',
				'mp3',
				'm4a',
				'wav',
				'ogg',
				'zip',
				'ogv',
				'mp4',
				'm4v',
				'mov',
				'wmv',
				'avi',
				'mpg',
				'3gp',
				'3g2',
			],
			show_on_front: 'posts',
			default_likes_enabled: true,
			default_sharing_status: true,
			default_comment_status: true,
			default_ping_status: true,
			software_version: '5.3.2',
			created_at: '2018-03-30T11:09:46+00:00',
			wordads: true,
			publicize_permanently_disabled: false,
			frame_nonce: '9259c8a8cb',
			jetpack_frame_nonce: '1579180048:0:52d3b39fea745e1a87ac36d8eedb8033',
			headstart: false,
			headstart_is_fresh: false,
			ak_vp_bundle_enabled: 0,
			advanced_seo_front_page_description: '',
			advanced_seo_title_formats: [],
			verification_services_codes: { 0: '0', google: '' },
			podcasting_archive: null,
			is_domain_only: false,
			is_automated_transfer: false,
			is_wpcom_atomic: false,
			is_wpcom_store: false,
			woocommerce_is_active: true,
			design_type: null,
			site_goals: null,
			site_segment: false,
			import_engine: null,
			jetpack_version: '8.1',
			main_network_site: `${ siteUrl }`,
			active_modules: [
				'contact-form',
				'custom-content-types',
				'custom-css',
				'enhanced-distribution',
				'gravatar-hovercards',
				'json-api',
				'latex',
				'notes',
				'post-by-email',
				'protect',
				'sharedaddy',
				'shortcodes',
				'shortlinks',
				'sitemaps',
				'stats',
				'verification-tools',
				'comment-likes',
				'related-posts',
				'subscriptions',
				'publicize',
				'copy-post',
				'monitor',
				'carousel',
				'markdown',
				'comments',
				'likes',
				'lazy-images',
				'infinite-scroll',
				'wordads',
				'sso',
				'widgets',
				'widget-visibility',
				'photon',
				'photon-cdn',
			],
			max_upload_size: false,
			wp_memory_limit: '268435456',
			wp_max_memory_limit: '268435456',
			is_multi_network: false,
			is_multi_site: false,
			file_mod_disabled: [ 'wp_auto_update_core_disabled' ],
		},
		plan,
		meta: {
			links: {
				self: 'https://public-api.wordpress.com/rest/v1.1/sites/id',
				help: 'https://public-api.wordpress.com/rest/v1.1/sites/id/help',
				posts: 'https://public-api.wordpress.com/rest/v1.1/sites/id/posts/',
				comments: 'https://public-api.wordpress.com/rest/v1.1/sites/id/comments/',
				xmlrpc: `${ siteUrl }/xmlrpc.php`,
			},
		},
		quota: {
			space_allowed: 2100373225472,
			space_used: 0,
			percent_used: 0,
			space_available: 2100373225472,
		},
		launch_status: false,
		site_migration: null,
		is_fse_active: false,
		is_fse_eligible: false,
	};
}

/**
 * Returns a JSON representation of Jetpack plan data.
 * TODO: Share the mock data with methods in jetpack/tests/php/general/test_class.jetpack-plan.php somehow.
 *
 * @param {string} type Jetpack plan slug.
 * @return {JSON} JSON Jetpack plan object.
 */
function getPlan( type ) {
	switch ( type ) {
		case 'jetpack_free':
			return {
				product_id: 2002,
				product_slug: 'jetpack_free',
				product_name: 'Jetpack Free',
				product_name_short: 'Free',
				expired: false,
				user_is_owner: false,
				is_free: true,
				features: {
					active: [ 'akismet' ],
					available: {
						akismet: [
							'jetpack_free',
							'jetpack_premium',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
						],
						'vaultpress-backups': [
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						],
						'vaultpress-backup-archive': [
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						],
						'vaultpress-storage-space': [
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						],
						'vaultpress-automated-restores': [
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						],
						'simple-payments': [
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						],
						support: [
							'jetpack_premium',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
						],
						'premium-themes': [ 'jetpack_business_monthly' ],
						'vaultpress-security-scanning': [ 'jetpack_business_monthly' ],
						polldaddy: [ 'jetpack_business_monthly' ],
					},
				},
			};

		case 'jetpack_complete':
			return {
				product_id: 2014,
				product_slug: 'jetpack_complete',
				product_name: 'Jetpack Complete',
				product_name_short: 'Complete',
				expired: false,
				user_is_owner: false,
				is_free: false,
				features: {
					active: [
						'akismet',
						'send-a-message',
						'social-previews',
						'donations',
						'core/audio',
						'premium-content/container',
						'support',
						'wordads-jetpack',
					],
					available: {
						akismet: [
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						],
						'send-a-message': [
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						],
						'social-previews': [
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
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
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
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
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						],
						'premium-content/container': [
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						],
						support: [
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							// DEPRECATED: Daily and Real-time variations will soon be retired.
							// Remove after all customers are migrated to new products.
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						],
						'premium-themes': [ 'jetpack_business', 'jetpack_business_monthly' ],
						'vaultpress-security-scanning': [ 'jetpack_business', 'jetpack_business_monthly' ],
						polldaddy: [ 'jetpack_business', 'jetpack_business_monthly' ],
					},
				},
			};
		default:
			throw new Error( `${ type } is not yet supported. Add it yourself!` );
	}
}

export async function syncPlanData( page ) {
	let isSame = false;
	let fePlan = null;

	const planJson = await execWpCommand( 'option get jetpack_active_plan --format=json' );
	const bePlan = JSON.parse( planJson );

	let i = 0;
	do {
		await page.reload( { waitFor: 'domcontentloaded' } );
		// eslint-disable-next-line no-undef, camelcase
		fePlan = await page.evaluate( () => Initial_State.siteData.plan.product_slug );
		logger.debug( `PLANS: frontend: ${ fePlan }, backend: ${ bePlan.product_slug }` );
		isSame = fePlan.trim() === bePlan.product_slug.trim();
		i = i + 1;
	} while ( ! isSame && i < 5 );
}
